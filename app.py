from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

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
        "notes": row["notes"] or "",
        "knowledgeUpdatedAt": row["knowledge_updated_at"] or "",
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
            (id, name, category, subcategory, brand, subtitle, description, tags_json, price, image, showcase, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            (id, name, label, logo, website, notes, knowledge_updated_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                brand.get("id"),
                brand.get("name") or "Brand",
                brand.get("label") or "",
                brand.get("logo") or "",
                brand.get("website") or "",
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
        INSERT INTO products (id, name, category, subcategory, brand, subtitle, description, tags_json, price, image, showcase, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            float(payload.get("price") or 0),
            payload.get("image") or "",
            1 if payload.get("showcase") else 0,
            now_iso(),
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


@app.post("/api/brands")
def api_create_brand() -> Any:
    if (resp := require_admin()) is not None:
        return resp
    db = get_db()
    payload = request.get_json(silent=True) or {}
    db.execute(
        """
        INSERT INTO brands (id, name, label, logo, website, notes, knowledge_updated_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.get("id"),
            payload.get("name") or "Brand",
            payload.get("label") or "",
            payload.get("logo") or "",
            payload.get("website") or "",
            payload.get("notes") or "",
            payload.get("knowledgeUpdatedAt") or now_iso(),
            now_iso(),
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
