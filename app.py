from __future__ import annotations

import json
import os
import re
import sqlite3
from html import unescape
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, quote_plus, urlparse
from urllib.request import Request, urlopen

from flask import Flask, g, jsonify, request, send_from_directory, session
from werkzeug.security import check_password_hash, generate_password_hash


BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = Path(os.environ.get("ZENIT_DATABASE_PATH", str(BASE_DIR / "zenit.db"))).resolve()
SECRET_KEY = os.environ.get("ZENIT_SECRET_KEY", "zenit-dev-secret-key")
ADMIN_USERNAME = "Zenit"
ADMIN_PASSWORD = "Qwerty78"
ORDER_STATUSES = [
    "Richiesta inviata",
    "Presa in carico",
    "In lavorazione",
    "Preventivo inviato",
    "Completato",
    "Annullato",
]


app = Flask(__name__, static_folder=".", static_url_path="")
app.config["SECRET_KEY"] = SECRET_KEY


def get_db() -> sqlite3.Connection:
    if "db" not in g:
        DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
        g.db = sqlite3.connect(DATABASE_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_error: Exception | None) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db() -> None:
    db = get_db()
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT,
            subcategory TEXT,
            brand TEXT,
            subtitle TEXT,
            description TEXT,
            tags_json TEXT NOT NULL DEFAULT '[]',
            documents_json TEXT NOT NULL DEFAULT '[]',
            price REAL NOT NULL DEFAULT 0,
            image TEXT,
            showcase INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS brands (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            label TEXT,
            logo TEXT,
            website TEXT,
            email TEXT,
            notes TEXT,
            knowledge_updated_at TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL,
            total_amount REAL NOT NULL DEFAULT 0,
            user_id TEXT,
            user_name TEXT NOT NULL,
            user_email TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS order_items (
            order_id TEXT NOT NULL,
            item_id TEXT,
            name TEXT NOT NULL,
            category TEXT,
            brand TEXT,
            price REAL NOT NULL DEFAULT 0,
            quantity INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY(order_id) REFERENCES orders(id)
        );
        """
    )
    product_columns = {row["name"] for row in db.execute("PRAGMA table_info(products)").fetchall()}
    if "subcategory" not in product_columns:
        db.execute("ALTER TABLE products ADD COLUMN subcategory TEXT")
    if "documents_json" not in product_columns:
        db.execute("ALTER TABLE products ADD COLUMN documents_json TEXT NOT NULL DEFAULT '[]'")
    brand_columns = {row["name"] for row in db.execute("PRAGMA table_info(brands)").fetchall()}
    if "email" not in brand_columns:
        db.execute("ALTER TABLE brands ADD COLUMN email TEXT")
    db.commit()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def row_to_product(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "category": row["category"] or "",
        "subcategory": row["subcategory"] or "",
        "brand": row["brand"] or "",
        "subtitle": row["subtitle"] or "",
        "description": row["description"] or "",
        "tags": json.loads(row["tags_json"] or "[]"),
        "documents": json.loads(row["documents_json"] or "[]"),
        "price": row["price"] or 0,
        "image": row["image"] or "",
        "showcase": bool(row["showcase"]),
    }


def row_to_brand(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "label": row["label"] or "",
        "logo": row["logo"] or "",
        "website": row["website"] or "",
        "email": row["email"] or "",
        "notes": row["notes"] or "",
        "knowledgeUpdatedAt": row["knowledge_updated_at"] or "",
    }


BRAND_CATEGORY_SIGNALS: dict[str, list[str]] = {
    "Anticaduta": ["fall protection", "anticaduta", "harness", "imbrac", "lifeline", "linee vita", "anchor", "cordino"],
    "Antinfortunistica": ["ppe", "dpi", "guanti", "helmet", "elmet", "safety glasses", "respirator", "protezion"],
    "Calzature e Abbigliamento": ["footwear", "safety shoes", "calzature", "abbigliamento", "workwear", "alta visibil", "protective clothing"],
    "Prodotti ATEX": ["atex", "explosion proof", "explosive atmosphere", "gas detector", "intrinsically safe"],
    "Spazi Confinati": ["confined space", "spazi confinati", "tripod", "retrieval", "rescue", "davit"],
    "Saldatura": ["welding", "saldatura", "welder", "maschere saldatura", "welding helmet"],
    "Sicurezza Ambientale": ["spill", "environmental", "antinquinamento", "containment", "assorbent", "gestione ambientale"],
}

BRAND_CERTIFICATION_SIGNALS: dict[str, list[str]] = {
    "ATEX": ["atex", "2014/34/eu"],
    "EN 361": ["en 361"],
    "EN 795": ["en 795"],
    "EN ISO 20471": ["en iso 20471", "high visibility"],
    "EN ISO 20345": ["en iso 20345", "s3", "s1p"],
    "ISO 9001": ["iso 9001"],
    "ISO 45001": ["iso 45001"],
    "CE": ["ce ", " ce-", "ce-certified", "marcatura ce", "certified ce"],
}

BRAND_SECTOR_SIGNALS: dict[str, list[str]] = {
    "Chimico": ["chemical", "chimic", "laboratory", "process plant"],
    "Petrolchimico": ["oil", "gas", "petro", "refinery", "offshore", "onshore"],
    "Edile & Costruzioni": ["construction", "cantiere", "roofing", "building", "scaffold"],
    "Energetico": ["energy", "power plant", "utility", "renewable", "electric"],
    "Navale & Marittimo": ["marine", "maritime", "shipyard", "naval", "offshore"],
    "Automotive & Trasporti": ["automotive", "transport", "assembly", "fleet", "warehouse"],
    "Servizi & Facility": ["facility", "maintenance", "service", "cleaning", "operations"],
}


def normalize_brand_website(website: str, email: str) -> str:
    raw = (website or "").strip()
    if not raw and email and "@" in email:
        domain = email.split("@", 1)[1].strip().lower()
        if domain:
            raw = f"https://{domain}"
    if raw and not re.match(r"^https?://", raw, flags=re.IGNORECASE):
        raw = f"https://{raw}"
    return raw


def strip_html_text(value: str) -> str:
    cleaned = re.sub(r"(?is)<script.*?>.*?</script>", " ", value)
    cleaned = re.sub(r"(?is)<style.*?>.*?</style>", " ", cleaned)
    cleaned = re.sub(r"(?s)<[^>]+>", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def truncate_words(value: str, limit: int) -> str:
    words = value.split()
    if len(words) <= limit:
        return value
    return " ".join(words[:limit]).strip() + "..."


def extract_site_snapshot(url: str) -> dict[str, str]:
    if not url:
        return {"url": "", "title": "", "description": "", "text": ""}
    try:
        request_obj = Request(
            url,
            headers={
                "User-Agent": "ZenitCarlo2/1.0 (+https://zenitsrl.it)"
            },
        )
        with urlopen(request_obj, timeout=8) as response:
            html = response.read(120000).decode("utf-8", errors="ignore")
        title_match = re.search(r"(?is)<title[^>]*>(.*?)</title>", html)
        desc_match = re.search(
            r'(?is)<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']',
            html,
        ) or re.search(
            r'(?is)<meta[^>]+content=["\'](.*?)["\'][^>]+name=["\']description["\']',
            html,
        )
        text = truncate_words(strip_html_text(html), 140)
        return {
            "url": url,
            "title": strip_html_text(title_match.group(1)) if title_match else "",
            "description": strip_html_text(desc_match.group(1)) if desc_match else "",
            "text": text,
        }
    except Exception:
        return {"url": url, "title": "", "description": "", "text": ""}


def find_signal_matches(source_text: str, signals: dict[str, list[str]], max_items: int = 4) -> list[str]:
    lowered = source_text.lower()
    matches: list[str] = []
    for label, keywords in signals.items():
        if any(keyword.lower() in lowered for keyword in keywords):
            matches.append(label)
    return matches[:max_items]


def infer_brand_knowledge(name: str, label: str, website: str, email: str) -> tuple[str, str]:
    normalized_website = normalize_brand_website(website, email)
    snapshot = extract_site_snapshot(normalized_website)
    source_text = " ".join(
        [
            name or "",
            label or "",
            email or "",
            snapshot.get("title", ""),
            snapshot.get("description", ""),
            snapshot.get("text", ""),
        ]
    ).strip()
    categories = find_signal_matches(source_text, BRAND_CATEGORY_SIGNALS)
    certifications = find_signal_matches(source_text, BRAND_CERTIFICATION_SIGNALS, max_items=5)
    sectors = find_signal_matches(source_text, BRAND_SECTOR_SIGNALS)

    parsed = urlparse(normalized_website) if normalized_website else None
    domain = (parsed.netloc or "").replace("www.", "") if parsed else ""

    identity_source = snapshot.get("description") or snapshot.get("title") or label or ""
    identity_line = truncate_words(identity_source, 22) if identity_source else ""

    note_parts: list[str] = []
    if identity_line:
        note_parts.append(f"Profilo rilevato: {identity_line}")
    if categories:
        note_parts.append(f"Aree probabili del brand: {', '.join(categories)}")
    if certifications:
        note_parts.append(f"Segnali di certificazione o conformita: {', '.join(certifications)}")
    if sectors:
        note_parts.append(f"Settori che il brand sembra servire: {', '.join(sectors)}")
    if domain:
        note_parts.append(f"Dominio analizzato: {domain}")
    if email:
        note_parts.append(f"Contatto aziendale collegato: {email}")

    if not note_parts:
        note_parts.append(
            "Carlo 2.0 non ha trovato abbastanza segnali automatici dal dominio collegato, ma il brand e stato registrato e potra essere arricchito in seguito."
        )

    inferred_label = label or identity_line or (
        f"Brand orientato a {categories[0].lower()}" if categories else "Brand partner tecnico"
    )
    return inferred_label, ". ".join(note_parts)


def get_token_overlap_score(query: str, candidate: str) -> int:
    query_tokens = {token for token in re.split(r"\s+", query.lower()) if len(token) > 2}
    candidate_tokens = {token for token in re.split(r"\s+", candidate.lower()) if len(token) > 2}
    if not query_tokens or not candidate_tokens:
        return 0
    score = 0
    for candidate_token in candidate_tokens:
        if any(
            candidate_token == query_token
            or candidate_token in query_token
            or query_token in candidate_token
            for query_token in query_tokens
        ):
            score += 1
    return score


def strip_html_fragment(value: str) -> str:
    return strip_html_text(unescape(value or ""))


def unwrap_duckduckgo_url(url: str) -> str:
    parsed = urlparse(url)
    if "duckduckgo.com" not in parsed.netloc:
        return url
    query = parse_qs(parsed.query)
    target = query.get("uddg", [""])[0]
    return target or url


def duckduckgo_search(query: str, limit: int = 4) -> list[dict[str, str]]:
    try:
        url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
        request_obj = Request(
            url,
            headers={
                "User-Agent": "ZenitCarlo2/1.0 (+https://zenitsrl.it)"
            },
        )
        with urlopen(request_obj, timeout=10) as response:
            html = response.read(180000).decode("utf-8", errors="ignore")
    except Exception:
        return []

    matches = re.findall(
        r'(?is)<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>.*?<a[^>]+class="result__snippet"[^>]*>(.*?)</a>|'
        r'(?is)<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>.*?<div[^>]+class="result__snippet"[^>]*>(.*?)</div>',
        html,
    )

    results: list[dict[str, str]] = []
    seen_urls: set[str] = set()
    for match in matches:
        raw_url = match[0] or match[3]
        title = match[1] or match[4]
        snippet = match[2] or match[5]
        final_url = unwrap_duckduckgo_url(raw_url)
        if not final_url or final_url in seen_urls:
            continue
        seen_urls.add(final_url)
        results.append(
            {
                "title": strip_html_fragment(title),
                "url": final_url,
                "snippet": truncate_words(strip_html_fragment(snippet), 36),
                "domain": urlparse(final_url).netloc.replace("www.", ""),
            }
        )
        if len(results) >= limit:
            break
    return results


def build_assistant_web_research(question: str, brands: list[dict[str, Any]], products: list[dict[str, Any]]) -> dict[str, Any]:
    normalized_question = strip_html_text(question)
    brand_candidates = sorted(
        brands,
        key=lambda brand: get_token_overlap_score(
            normalized_question,
            " ".join([brand.get("name", ""), brand.get("label", ""), brand.get("website", ""), brand.get("notes", "")]),
        ),
        reverse=True,
    )
    brand_candidates = [brand for brand in brand_candidates if brand.get("website")][:3]

    brand_sources: list[dict[str, str]] = []
    for brand in brand_candidates:
        snapshot = extract_site_snapshot(brand.get("website") or "")
        summary = snapshot.get("description") or snapshot.get("title") or snapshot.get("text") or ""
        if not summary:
            continue
        brand_sources.append(
            {
                "type": "brand",
                "title": f"{brand.get('name') or 'Brand'} • sito ufficiale",
                "url": snapshot.get("url") or brand.get("website") or "",
                "snippet": truncate_words(summary, 36),
                "domain": urlparse(snapshot.get("url") or brand.get("website") or "").netloc.replace("www.", ""),
            }
        )

    product_candidates = sorted(
        products,
        key=lambda product: get_token_overlap_score(
            normalized_question,
            " ".join(
                [
                    product.get("name", ""),
                    product.get("brand", ""),
                    product.get("category", ""),
                    product.get("subcategory", ""),
                    product.get("description", ""),
                    " ".join(product.get("tags") or []),
                ]
            ),
        ),
        reverse=True,
    )
    product_candidates = [product for product in product_candidates if get_token_overlap_score(normalized_question, product.get("name", "")) > 0][:3]

    search_results = duckduckgo_search(f"{normalized_question} DPI sicurezza brand attrezzature", limit=4)
    fetched_web_sources: list[dict[str, str]] = []
    for result in search_results[:3]:
        if not result.get("url", "").startswith(("http://", "https://")):
            continue
        snapshot = extract_site_snapshot(result["url"])
        enriched_snippet = snapshot.get("description") or snapshot.get("text") or result.get("snippet") or ""
        fetched_web_sources.append(
            {
                "type": "web",
                "title": result.get("title") or result.get("domain") or "Fonte web",
                "url": result.get("url") or "",
                "snippet": truncate_words(enriched_snippet, 40),
                "domain": result.get("domain") or urlparse(result.get("url") or "").netloc.replace("www.", ""),
            }
        )

    sources = [*brand_sources]
    for result in [*fetched_web_sources, *search_results]:
        if result["url"] not in {source["url"] for source in sources}:
            sources.append({**result, "type": result.get("type") or "web"})

    answer_parts: list[str] = []
    if brand_sources:
        highlights = "; ".join(
            f"{source['title'].split(' • ')[0]}: {source['snippet']}" for source in brand_sources[:2]
        )
        answer_parts.append(f"Dalle fonti ufficiali dei brand collegati emergono questi segnali utili: {highlights}.")

    if product_candidates:
        product_summary = ", ".join(
            f"{product.get('name')} ({product.get('brand') or product.get('category') or 'catalogo Zenit'})"
            for product in product_candidates
        )
        answer_parts.append(f"Nel catalogo Zenit vedo prodotti coerenti con la richiesta: {product_summary}.")

    if fetched_web_sources or search_results:
        web_summary = "; ".join(
            f"{result['domain'] or result['title']}: {result['snippet']}" for result in ([*fetched_web_sources, *search_results])[:3]
        )
        answer_parts.append(f"Incrociando la ricerca web interna, i riferimenti piu vicini sono: {web_summary}.")

    if not answer_parts:
        answer_parts.append(
            "Ho provato ad ampliare la risposta con la ricerca integrata, ma non ho trovato riferimenti abbastanza solidi. Conviene agganciare un brand con sito ufficiale o affinare meglio la richiesta tecnica."
        )

    return {
        "answer": " ".join(answer_parts),
        "sources": sources[:6],
    }


def get_current_user() -> dict[str, Any] | None:
    user_id = session.get("user_id")
    if not user_id:
        return None
    db = get_db()
    row = db.execute("SELECT id, name, email FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        session.pop("user_id", None)
        return None
    return {"id": row["id"], "name": row["name"], "email": row["email"]}


def get_all_products() -> list[dict[str, Any]]:
    db = get_db()
    rows = db.execute("SELECT * FROM products ORDER BY created_at DESC").fetchall()
    return [row_to_product(row) for row in rows]


def get_all_brands() -> list[dict[str, Any]]:
    db = get_db()
    rows = db.execute("SELECT * FROM brands ORDER BY created_at DESC").fetchall()
    return [row_to_brand(row) for row in rows]


def get_orders_for_current_context() -> list[dict[str, Any]]:
    db = get_db()
    if session.get("is_admin"):
        order_rows = db.execute("SELECT * FROM orders ORDER BY created_at DESC").fetchall()
    else:
        user = get_current_user()
        if not user:
            return []
        order_rows = db.execute("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()

    orders: list[dict[str, Any]] = []
    for row in order_rows:
        item_rows = db.execute(
            "SELECT * FROM order_items WHERE order_id = ? ORDER BY rowid ASC",
            (row["id"],),
        ).fetchall()
        items = [
            {
                "id": item["item_id"],
                "name": item["name"],
                "category": item["category"] or "",
                "brand": item["brand"] or "",
                "price": item["price"] or 0,
                "quantity": item["quantity"] or 1,
            }
            for item in item_rows
        ]
        orders.append(
            {
                "id": row["id"],
                "createdAt": row["created_at"],
                "status": row["status"],
                "totalAmount": row["total_amount"] or 0,
                "userId": row["user_id"],
                "userName": row["user_name"],
                "userEmail": row["user_email"] or "",
                "items": items,
            }
        )
    return orders


def require_admin() -> tuple[dict[str, Any], int] | None:
    if not session.get("is_admin"):
        return jsonify({"error": "Autenticazione admin richiesta."}), 403
    return None


def get_bootstrap_payload() -> dict[str, Any]:
    return {
        "products": get_all_products(),
        "brands": get_all_brands(),
        "currentUser": get_current_user(),
        "isAdmin": bool(session.get("is_admin")),
        "orders": get_orders_for_current_context(),
        "orderStatuses": ORDER_STATUSES,
    }


@app.before_request
def _ensure_db() -> None:
    init_db()


@app.get("/")
def serve_index() -> Any:
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/<path:path>")
def serve_static(path: str) -> Any:
    target = BASE_DIR / path
    if target.exists() and target.is_file():
        return send_from_directory(BASE_DIR, path)
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/api/bootstrap")
def api_bootstrap() -> Any:
    return jsonify(get_bootstrap_payload())


@app.get("/health")
def healthcheck() -> Any:
    return jsonify(
        {
            "ok": True,
            "databasePath": str(DATABASE_PATH),
            "products": len(get_all_products()),
            "brands": len(get_all_brands()),
        }
    )


@app.post("/api/migrate")
def api_migrate() -> Any:
    db = get_db()
    payload = request.get_json(silent=True) or {}
    imported = {"users": 0, "products": 0, "brands": 0, "orders": 0}

    for user in payload.get("users", []):
        if not user.get("email") or not user.get("password"):
            continue
        try:
            db.execute(
                """
                INSERT OR IGNORE INTO users (id, name, email, password_hash, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    user.get("id"),
                    user.get("name") or "Utente",
                    str(user.get("email")).strip().lower(),
                    generate_password_hash(user.get("password")),
                    now_iso(),
                ),
            )
            imported["users"] += 1
        except sqlite3.IntegrityError:
            pass

    for product in payload.get("products", []):
        db.execute(
            """
            INSERT OR IGNORE INTO products
            (id, name, category, subcategory, brand, subtitle, description, tags_json, documents_json, price, image, showcase, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                product.get("id"),
                product.get("name") or "Prodotto",
                product.get("category") or "",
                product.get("subcategory") or "",
                product.get("brand") or "",
                product.get("subtitle") or "",
                product.get("description") or "",
                json.dumps(product.get("tags") or []),
                json.dumps(product.get("documents") or []),
                float(product.get("price") or 0),
                product.get("image") or "",
                1 if product.get("showcase") else 0,
                now_iso(),
            ),
        )
        imported["products"] += 1

    for brand in payload.get("brands", []):
        db.execute(
            """
            INSERT OR IGNORE INTO brands
            (id, name, label, logo, website, email, notes, knowledge_updated_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                brand.get("id"),
                brand.get("name") or "Brand",
                brand.get("label") or "",
                brand.get("logo") or "",
                normalize_brand_website(brand.get("website") or "", brand.get("email") or ""),
                brand.get("email") or "",
                brand.get("notes") or "",
                brand.get("knowledgeUpdatedAt") or "",
                now_iso(),
            ),
        )
        imported["brands"] += 1

    for order in payload.get("orders", []):
        db.execute(
            """
            INSERT OR IGNORE INTO orders
            (id, created_at, status, total_amount, user_id, user_name, user_email)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                order.get("id"),
                order.get("createdAt") or now_iso(),
                order.get("status") or "Richiesta inviata",
                float(order.get("totalAmount") or 0),
                order.get("userId"),
                order.get("userName") or "Utente",
                order.get("userEmail") or "",
            ),
        )
        db.execute("DELETE FROM order_items WHERE order_id = ?", (order.get("id"),))
        for item in order.get("items", []):
            db.execute(
                """
                INSERT INTO order_items (order_id, item_id, name, category, brand, price, quantity)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    order.get("id"),
                    item.get("id"),
                    item.get("name") or "Prodotto",
                    item.get("category") or "",
                    item.get("brand") or "",
                    float(item.get("price") or 0),
                    int(item.get("quantity") or 1),
                ),
            )
        imported["orders"] += 1

    db.commit()
    return jsonify({"ok": True, "imported": imported, **get_bootstrap_payload()})


@app.post("/api/auth/register")
def api_auth_register() -> Any:
    db = get_db()
    payload = request.get_json(silent=True) or {}
    name = str(payload.get("name") or "").strip()
    email = str(payload.get("email") or "").strip().lower()
    password = str(payload.get("password") or "")
    user_id = str(payload.get("id") or "")
    if not name or not email or len(password) < 6:
        return jsonify({"error": "Dati registrazione non validi."}), 400

    try:
        db.execute(
            """
            INSERT INTO users (id, name, email, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id or f"user-{int(datetime.now().timestamp() * 1000)}", name, email, generate_password_hash(password), now_iso()),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "Esiste gia un account con questa email."}), 409

    row = db.execute("SELECT id, name, email FROM users WHERE email = ?", (email,)).fetchone()
    session["user_id"] = row["id"]
    session.pop("is_admin", None)
    return jsonify({"ok": True, "currentUser": {"id": row["id"], "name": row["name"], "email": row["email"]}})


@app.post("/api/auth/login")
def api_auth_login() -> Any:
    db = get_db()
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email") or "").strip().lower()
    password = str(payload.get("password") or "")
    row = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "Credenziali non valide."}), 401

    session["user_id"] = row["id"]
    session.pop("is_admin", None)
    return jsonify({"ok": True, "currentUser": {"id": row["id"], "name": row["name"], "email": row["email"]}})


@app.post("/api/auth/logout")
def api_auth_logout() -> Any:
    session.pop("user_id", None)
    return jsonify({"ok": True})


@app.post("/api/admin/login")
def api_admin_login() -> Any:
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username") or "").strip()
    password = str(payload.get("password") or "")
    if username != ADMIN_USERNAME or password != ADMIN_PASSWORD:
        return jsonify({"error": "Credenziali admin non valide."}), 401
    session["is_admin"] = True
    return jsonify({"ok": True})


@app.post("/api/admin/logout")
def api_admin_logout() -> Any:
    session.pop("is_admin", None)
    return jsonify({"ok": True})


@app.post("/api/products")
def api_create_product() -> Any:
    if (resp := require_admin()) is not None:
        return resp
    db = get_db()
    payload = request.get_json(silent=True) or {}
    db.execute(
        """
        INSERT INTO products (id, name, category, subcategory, brand, subtitle, description, tags_json, documents_json, price, image, showcase, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.get("id"),
            payload.get("name") or "Prodotto",
            payload.get("category") or "",
            payload.get("subcategory") or "",
            payload.get("brand") or "",
            payload.get("subtitle") or "",
            payload.get("description") or "",
            json.dumps(payload.get("tags") or []),
            json.dumps(payload.get("documents") or []),
            float(payload.get("price") or 0),
            payload.get("image") or "",
            1 if payload.get("showcase") else 0,
            now_iso(),
        ),
    )
    db.commit()
    return jsonify({"ok": True, "products": get_all_products()})


@app.patch("/api/products/<product_id>")
def api_update_product(product_id: str) -> Any:
    if (resp := require_admin()) is not None:
        return resp
    db = get_db()
    row = db.execute("SELECT id FROM products WHERE id = ?", (product_id,)).fetchone()
    if not row:
        return jsonify({"error": "Prodotto non trovato."}), 404

    payload = request.get_json(silent=True) or {}
    db.execute(
        """
        UPDATE products
        SET name = ?, category = ?, subcategory = ?, brand = ?, subtitle = ?, description = ?, tags_json = ?, documents_json = ?, price = ?, image = ?, showcase = ?
        WHERE id = ?
        """,
        (
            payload.get("name") or "Prodotto",
            payload.get("category") or "",
            payload.get("subcategory") or "",
            payload.get("brand") or "",
            payload.get("subtitle") or "",
            payload.get("description") or "",
            json.dumps(payload.get("tags") or []),
            json.dumps(payload.get("documents") or []),
            float(payload.get("price") or 0),
            payload.get("image") or "",
            1 if payload.get("showcase") else 0,
            product_id,
        ),
    )
    db.commit()
    return jsonify({"ok": True, "products": get_all_products()})


@app.delete("/api/products/<product_id>")
def api_delete_product(product_id: str) -> Any:
    if (resp := require_admin()) is not None:
        return resp
    db = get_db()
    db.execute("DELETE FROM products WHERE id = ?", (product_id,))
    db.commit()
    return jsonify({"ok": True, "products": get_all_products()})


@app.patch("/api/products/<product_id>/showcase")
def api_toggle_product_showcase(product_id: str) -> Any:
    if (resp := require_admin()) is not None:
        return resp
    db = get_db()
    row = db.execute("SELECT showcase FROM products WHERE id = ?", (product_id,)).fetchone()
    if not row:
        return jsonify({"error": "Prodotto non trovato."}), 404
    next_value = 0 if row["showcase"] else 1
    db.execute("UPDATE products SET showcase = ? WHERE id = ?", (next_value, product_id))
    db.commit()
    return jsonify({"ok": True, "products": get_all_products()})


@app.post("/api/assistant/research")
def api_assistant_research() -> Any:
    payload = request.get_json(silent=True) or {}
    question = str(payload.get("question") or "").strip()
    if not question:
        return jsonify({"error": "Domanda mancante."}), 400
    research = build_assistant_web_research(question, get_all_brands(), get_all_products())
    return jsonify({"ok": True, **research})


@app.post("/api/brands")
def api_create_brand() -> Any:
    if (resp := require_admin()) is not None:
        return resp
    db = get_db()
    payload = request.get_json(silent=True) or {}
    inferred_label, inferred_notes = infer_brand_knowledge(
        str(payload.get("name") or "").strip(),
        str(payload.get("label") or "").strip(),
        str(payload.get("website") or "").strip(),
        str(payload.get("email") or "").strip(),
    )
    db.execute(
        """
        INSERT INTO brands (id, name, label, logo, website, email, notes, knowledge_updated_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.get("id"),
            payload.get("name") or "Brand",
            payload.get("label") or inferred_label,
            payload.get("logo") or "",
            normalize_brand_website(payload.get("website") or "", payload.get("email") or ""),
            payload.get("email") or "",
            payload.get("notes") or inferred_notes,
            payload.get("knowledgeUpdatedAt") or now_iso(),
            now_iso(),
        ),
    )
    db.commit()
    return jsonify({"ok": True, "brands": get_all_brands()})


@app.patch("/api/brands/<brand_id>")
def api_update_brand(brand_id: str) -> Any:
    if (resp := require_admin()) is not None:
        return resp
    db = get_db()
    existing = db.execute("SELECT id, created_at FROM brands WHERE id = ?", (brand_id,)).fetchone()
    if not existing:
        return jsonify({"error": "Brand non trovato."}), 404

    payload = request.get_json(silent=True) or {}
    inferred_label, inferred_notes = infer_brand_knowledge(
        str(payload.get("name") or "").strip(),
        str(payload.get("label") or "").strip(),
        str(payload.get("website") or "").strip(),
        str(payload.get("email") or "").strip(),
    )
    db.execute(
        """
        UPDATE brands
        SET name = ?, label = ?, logo = ?, website = ?, email = ?, notes = ?, knowledge_updated_at = ?
        WHERE id = ?
        """,
        (
            payload.get("name") or "Brand",
            payload.get("label") or inferred_label,
            payload.get("logo") or "",
            normalize_brand_website(payload.get("website") or "", payload.get("email") or ""),
            payload.get("email") or "",
            payload.get("notes") or inferred_notes,
            payload.get("knowledgeUpdatedAt") or now_iso(),
            brand_id,
        ),
    )
    db.commit()
    return jsonify({"ok": True, "brands": get_all_brands()})


@app.delete("/api/brands/<brand_id>")
def api_delete_brand(brand_id: str) -> Any:
    if (resp := require_admin()) is not None:
        return resp
    db = get_db()
    db.execute("DELETE FROM brands WHERE id = ?", (brand_id,))
    db.commit()
    return jsonify({"ok": True, "brands": get_all_brands()})


@app.post("/api/orders")
def api_create_order() -> Any:
    user = get_current_user()
    if not user:
        return jsonify({"error": "Accesso utente richiesto."}), 401
    db = get_db()
    payload = request.get_json(silent=True) or {}
    items = payload.get("items") or []
    if not items:
        return jsonify({"error": "Nessun articolo selezionato."}), 400

    order_id = payload.get("id") or f"ORD-{int(datetime.now().timestamp() * 1000)}"
    created_at = payload.get("createdAt") or now_iso()
    total_amount = float(payload.get("totalAmount") or 0)
    db.execute(
        """
        INSERT INTO orders (id, created_at, status, total_amount, user_id, user_name, user_email)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            order_id,
            created_at,
            "Richiesta inviata",
            total_amount,
            user["id"],
            user["name"],
            user["email"],
        ),
    )
    for item in items:
        db.execute(
            """
            INSERT INTO order_items (order_id, item_id, name, category, brand, price, quantity)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                order_id,
                item.get("id"),
                item.get("name") or "Prodotto",
                item.get("category") or "",
                item.get("brand") or "",
                float(item.get("price") or 0),
                int(item.get("quantity") or 1),
            ),
        )
    db.commit()
    return jsonify({"ok": True, "orders": get_orders_for_current_context()})


@app.patch("/api/orders/<order_id>/status")
def api_patch_order_status(order_id: str) -> Any:
    if (resp := require_admin()) is not None:
        return resp
    db = get_db()
    payload = request.get_json(silent=True) or {}
    status = payload.get("status")
    if status not in ORDER_STATUSES:
        return jsonify({"error": "Stato ordine non valido."}), 400
    db.execute("UPDATE orders SET status = ? WHERE id = ?", (status, order_id))
    db.commit()
    return jsonify({"ok": True, "orders": get_orders_for_current_context()})


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", "5000"))
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1", host="0.0.0.0", port=port)
