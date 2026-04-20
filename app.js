const PRODUCTS_KEY = "zenit-admin-products";
const BRANDS_KEY = "zenit-admin-brands";
const CART_KEY = "zenit-cart";
const ADMIN_AUTH_KEY = "zenit-admin-auth";
const ASSISTANT_WEB_MODE_KEY = "zenit-assistant-web-mode";
const ASSISTANT_OPEN_STATE_KEY = "zenit-assistant-open";
const USERS_KEY = "zenit-site-users";
const USER_AUTH_KEY = "zenit-site-user-auth";
const ORDERS_KEY = "zenit-site-orders";
const USER_REDIRECT_KEY = "zenit-site-user-redirect";
const ADMIN_USERNAME = "Zenit";
const ADMIN_PASSWORD = "Qwerty78";
const ORDER_STATUSES = ["Richiesta inviata", "Presa in carico", "In lavorazione", "Preventivo inviato", "Completato", "Annullato"];
const currentPage = document.body.dataset.page || "home";

const productGrid = document.querySelector("#product-grid");
const categoryFilters = document.querySelector("#category-filters");
const brandsTrack = document.querySelector("#brands-track");
const searchInput = document.querySelector("#search-input");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");
const cartItems = document.querySelector("#cart-items");
const cartButton = document.querySelector("#cart-button");
const cartDrawer = document.querySelector("#cart-drawer");
const closeCart = document.querySelector("#close-cart");
const cartCheckoutButton = document.querySelector("#cart-checkout-button");
const backdrop = document.querySelector("#backdrop");
const heroProductCount = document.querySelector("#hero-product-count");
const heroProductCountInline = document.querySelector("#hero-product-count-inline");
const heroCatalogEmpty = document.querySelector("#hero-catalog-empty");
const heroCatalogProduct = document.querySelector("#hero-catalog-product");
const heroProductImage = document.querySelector("#hero-product-image");
const heroProductName = document.querySelector("#hero-product-name");
const heroProductSubtitle = document.querySelector("#hero-product-subtitle");
const heroProductMeta = document.querySelector("#hero-product-meta");
let heroCatalogRotationIndex = 0;
let heroCatalogRotationTimer = null;
const adminForm = document.querySelector("#admin-form");
const brandForm = document.querySelector("#brand-form");
const adminProductList = document.querySelector("#admin-product-list");
const adminBrandList = document.querySelector("#admin-brand-list");
const adminProductCount = document.querySelector("#admin-product-count");
const brandCount = document.querySelector("#brand-count");
const adminLoginPanel = document.querySelector("#admin-login");
const adminProtected = document.querySelector("#admin-protected");
const adminOrdersList = document.querySelector("#admin-orders-list");
const adminOrdersCount = document.querySelector("#admin-orders-count");
const adminLoginForm = document.querySelector("#admin-login-form");
const adminLoginMessage = document.querySelector("#admin-login-message");
const adminLogoutButton = document.querySelector("#admin-logout");
const userSession = document.querySelector("#user-session");
const userLoginForm = document.querySelector("#user-login-form");
const userRegisterForm = document.querySelector("#user-register-form");
const userLoginMessage = document.querySelector("#user-login-message");
const userRegisterMessage = document.querySelector("#user-register-message");
const ordersPageMessage = document.querySelector("#orders-page-message");
const ordersList = document.querySelector("#orders-list");
const ordersCount = document.querySelector("#orders-count");
const revealElements = document.querySelectorAll(".reveal");
const heroSection = document.querySelector(".hero");
const mainHeader = document.querySelector(".main-header");
const scrollProgressBar = document.querySelector("#scroll-progress-bar");
const navItems = document.querySelectorAll(".nav-item");
const navTriggers = document.querySelectorAll(".nav-item .nav-trigger");
const catalogNav = document.querySelector("#catalog-nav");
const catalogNavToggle = document.querySelector("#catalog-nav-toggle");
const openCartLinks = document.querySelectorAll("[data-open-cart='true']");
const countUpElements = document.querySelectorAll(".count-up");
const assistantToggle = document.querySelector("#assistant-toggle");
const assistantPanel = document.querySelector("#assistant-panel");
const assistantClose = document.querySelector("#assistant-close");
const assistantMessages = document.querySelector("#assistant-messages");
const assistantForm = document.querySelector("#assistant-form");
const assistantInput = document.querySelector("#assistant-input");
const assistantSuggestions = document.querySelector("#assistant-suggestions");
const assistantAdminPanel = document.querySelector("#assistant-admin-panel");
const assistantWebModeToggle = document.querySelector("#assistant-web-mode");
const assistantStatusCopy = document.querySelector("#assistant-status-copy");
const adminCategorySelect = document.querySelector("#admin-category");
const adminSubcategorySelect = document.querySelector("#admin-subcategory");
const brandKnowledgePreview = document.querySelector("#brand-knowledge-preview");
const adminProductIdField = document.querySelector("#admin-product-id");
const adminProductSubmitButton = document.querySelector("#admin-product-submit-button");
const adminProductCancelEditButton = document.querySelector("#admin-product-cancel-edit");
const adminProductFormStatus = document.querySelector("#admin-product-form-status");
const brandIdField = document.querySelector("#brand-id");
const brandSubmitButton = document.querySelector("#brand-submit-button");
const brandCancelEditButton = document.querySelector("#brand-cancel-edit");
const brandFormStatus = document.querySelector("#brand-form-status");
let productInfoModal = null;

const PRODUCT_TAXONOMY = {
  Anticaduta: ["Imbracature base", "Imbracature professionali", "Kit completi", "Cordini", "Connettori", "Ancoraggi e linee vita"],
  Antinfortunistica: ["Testa", "Vista", "Udito", "Mani", "Vie respiratorie", "Monouso"],
  "Calzature e Abbigliamento": ["S1P", "S3", "Alte prestazioni", "Alta visibilita", "Tecnico da cantiere", "Multiprotezione"],
  "Prodotti ATEX": ["Rilevatori gas", "Monitoraggio", "Accessori certificati", "Illuminazione ATEX", "Strumentazione", "Dispositivi portatili"],
  "Spazi Confinati": ["Treppiedi e davit", "Recuperatori", "Kit evacuazione", "Comunicazione", "Ventilazione", "Illuminazione"],
  Saldatura: ["Maschere", "Guanti", "Abbigliamento", "Consumabili", "Accessori", "Protezione area lavoro"],
  "Soluzioni Ambientali": ["Soluzioni antinquinamento", "Gestione ambientale", "Supporto operativo"]
};

let products = loadProducts();
let brands = loadBrands();
let cart = loadCart();
let users = loadUsers();
let orders = loadOrders();
let activeCategory = getInitialCategory();
let query = "";
let currentUser = null;
let adminAuthenticated = false;
let backendReady = false;
let editingProductId = null;
let editingBrandId = null;
let assistantConversationState = {
  lastIntent: null,
  lastSector: null,
  lastCategory: null,
  lastMicrocategory: null,
  lastBrand: null,
  lastNeedProfile: null,
  lastSuggestedCategories: [],
  lastQuestion: ""
};
let lastScrollTop = 0;
let headerRetracted = false;
let scrollChromeFrame = null;

function isAdminAuthenticated() {
  return adminAuthenticated;
}

function setAdminAuthenticated(value) {
  adminAuthenticated = Boolean(value);
}

function getInitialCategory() {
  const params = new URLSearchParams(window.location.search);
  return params.get("categoria") || "Tutti";
}

function normalizeProduct(product) {
  return {
    ...product,
    category: String(product.category || "").trim(),
    subcategory: String(product.subcategory || "").trim(),
    brand: String(product.brand || "").trim(),
    subtitle: String(product.subtitle || "").trim(),
    description: String(product.description || "").trim(),
    tags: Array.isArray(product.tags) ? product.tags.filter(Boolean) : [],
    showcase: Boolean(product.showcase)
  };
}

function normalizeBrand(brand) {
  return {
    ...brand,
    name: String(brand.name || "").trim(),
    label: String(brand.label || "").trim(),
    logo: String(brand.logo || "").trim(),
    website: String(brand.website || "").trim(),
    email: String(brand.email || "").trim(),
    notes: String(brand.notes || "").trim(),
    knowledgeUpdatedAt: String(brand.knowledgeUpdatedAt || "").trim()
  };
}

function loadProducts() {
  return [];
}

function loadBrands() {
  return [];
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function loadUsers() {
  return [];
}

function loadOrders() {
  return [];
}

function saveProducts() {
  return;
}

function saveBrands() {
  return;
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function saveUsers() {
  return;
}

function saveOrders() {
  return;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getCurrentUser() {
  return currentUser;
}

function setCurrentUser(user) {
  currentUser = user || null;
  renderUserSession();
}

function setUserRedirectTarget(target) {
  if (target) {
    sessionStorage.setItem(USER_REDIRECT_KEY, target);
  } else {
    sessionStorage.removeItem(USER_REDIRECT_KEY);
  }
}

function getUserRedirectTarget() {
  return sessionStorage.getItem(USER_REDIRECT_KEY);
}

function isAssistantWebModeEnabled() {
  return true;
}

function setAssistantWebModeEnabled(value) {
  syncAssistantAdminState();
}

function getAssistantStoredOpenState() {
  try {
    return sessionStorage.getItem(ASSISTANT_OPEN_STATE_KEY) === "true";
  } catch {
    return false;
  }
}

function setAssistantStoredOpenState(value) {
  try {
    sessionStorage.setItem(ASSISTANT_OPEN_STATE_KEY, String(Boolean(value)));
  } catch {
    // no-op
  }
}

function getBackendAccessMessage() {
  if (window.location.protocol === "file:") {
    return "Per usare login, catalogo admin e ordini devi aprire il sito tramite il server locale Zenit, non come file HTML diretto.";
  }
  return "Il backend Zenit non risponde. Avvia il server locale e ricarica la pagina.";
}

function notifyBackendUnavailable(context = "general") {
  backendReady = false;
  const message = getBackendAccessMessage();

  if (context === "admin-login") {
    setAdminLoginFeedback(message, true);
  } else if (context === "user-login") {
    setUserAuthFeedback(userLoginMessage, message, true);
  } else if (context === "user-register") {
    setUserAuthFeedback(userRegisterMessage, message, true);
  } else {
    window.alert(message);
  }
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.error || "Richiesta server non riuscita.");
  }

  return payload;
}

function getLegacyItems(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function getLegacyMigrationPayload() {
  return {
    users: getLegacyItems(USERS_KEY),
    products: getLegacyItems(PRODUCTS_KEY),
    brands: getLegacyItems(BRANDS_KEY),
    orders: getLegacyItems(ORDERS_KEY)
  };
}

function hasLegacyData(payload) {
  return Object.values(payload).some((items) => Array.isArray(items) && items.length > 0);
}

function clearLegacyServerData() {
  localStorage.removeItem(PRODUCTS_KEY);
  localStorage.removeItem(BRANDS_KEY);
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(ORDERS_KEY);
}

function applyServerState(payload = {}) {
  products = (payload.products || []).map(normalizeProduct);
  brands = (payload.brands || []).map(normalizeBrand).filter((brand) => brand.name);
  orders = (payload.orders || []).map((order) => ({
    ...order,
    status: ORDER_STATUSES.includes(order.status) ? order.status : "Richiesta inviata"
  }));
  currentUser = payload.currentUser || null;
  adminAuthenticated = Boolean(payload.isAdmin);
  renderUserSession();
  refreshAll();
  syncAssistantAdminState();
}

async function bootstrapApp() {
  const legacyPayload = getLegacyMigrationPayload();
  let payload = await apiFetch("/api/bootstrap", { method: "GET", headers: {} });

  const backendEmpty = !payload.products?.length && !payload.brands?.length && !payload.orders?.length;
  if (backendEmpty && hasLegacyData(legacyPayload)) {
    payload = await apiFetch("/api/migrate", {
      method: "POST",
      body: JSON.stringify(legacyPayload)
    });
    clearLegacyServerData();
  }

  applyServerState(payload);
  backendReady = true;
}

function formatPrice(value) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
}

function formatOrderDate(value) {
  try {
    return new Intl.DateTimeFormat("it-IT", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function renderUserSession() {
  if (!userSession) return;
  const currentUser = getCurrentUser();

  if (!currentUser) {
    userSession.innerHTML = `
      <a href="auth.html">Accedi</a>
      <a class="register-button" href="auth.html#register">Registrati</a>
    `;
    return;
  }

  userSession.innerHTML = `
    <span class="user-session__badge">Ciao, ${currentUser.name}</span>
    <button class="ghost-button" type="button" id="user-logout">Esci</button>
  `;

  userSession.querySelector("#user-logout")?.addEventListener("click", () => {
    apiFetch("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({})
    })
      .catch(() => null)
      .finally(() => {
        setCurrentUser(null);
        if (currentPage === "auth" || currentPage === "orders") {
          window.location.href = "index.html";
        } else {
          refreshAll();
        }
      });
  });
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createPlaceholderImage(name = "Zenit") {
  const label = encodeURIComponent(name.slice(0, 24));
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f3fbf4" />
          <stop offset="100%" stop-color="#dff3e4" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" rx="48" fill="url(#g)" />
      <circle cx="400" cy="260" r="120" fill="#0d7f39" opacity="0.12" />
      <text x="400" y="420" text-anchor="middle" fill="#0d7f39" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="800">${label}</text>
      <text x="400" y="485" text-anchor="middle" fill="#6b8d77" font-family="Inter, Arial, sans-serif" font-size="22">Prodotto catalogo Zenit</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createBrandPlaceholder(name = "Brand") {
  const label = encodeURIComponent(name.slice(0, 18));
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="220" viewBox="0 0 640 220">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#eef6ef" />
        </linearGradient>
      </defs>
      <rect width="640" height="220" rx="32" fill="url(#g)" />
      <text x="320" y="128" text-anchor="middle" fill="#0d7f39" font-family="Inter, Arial, sans-serif" font-size="64" font-weight="800">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function isRenderableImageSource(value) {
  const src = String(value || "").trim();
  if (!src) return false;
  if (/^data:image\//i.test(src)) return true;
  if (/^https?:\/\//i.test(src)) return true;
  if (/^\//.test(src)) return true;
  if (/^[a-z0-9][a-z0-9/_\-.]+\.(png|jpe?g|webp|gif|svg)$/i.test(src)) return true;
  if (/^[a-z]:\\/i.test(src) || /^file:\/\//i.test(src)) return false;
  return false;
}

function getProductImageSource(product) {
  const image = String(product?.image || "").trim();
  return isRenderableImageSource(image) ? image : createPlaceholderImage(product?.name || "Zenit");
}

function getCategories() {
  return ["Tutti", ...new Set(products.map((product) => product.category).filter(Boolean))];
}

function getTaxonomyCategories() {
  return Object.keys(PRODUCT_TAXONOMY);
}

function populateSubcategoryOptions(category, selectedValue = "") {
  if (!adminSubcategorySelect) return;

  const microcategories = PRODUCT_TAXONOMY[category] || [];
  const placeholder = category ? "Seleziona micro categoria" : "Seleziona prima una macro categoria";

  adminSubcategorySelect.innerHTML = [
    `<option value="">${placeholder}</option>`,
    ...microcategories.map(
      (microcategory) => `<option value="${microcategory}" ${microcategory === selectedValue ? "selected" : ""}>${microcategory}</option>`
    )
  ].join("");

  adminSubcategorySelect.disabled = !category;
}

function hydrateAdminCategorySelects() {
  if (!adminCategorySelect) return;

  const currentCategory = adminCategorySelect.value || "";
  const currentSubcategory = adminSubcategorySelect?.value || "";

  adminCategorySelect.innerHTML = [
    '<option value="">Seleziona macro categoria</option>',
    ...getTaxonomyCategories().map(
      (category) => `<option value="${category}" ${category === currentCategory ? "selected" : ""}>${category}</option>`
    )
  ].join("");

  const nextCategory = PRODUCT_TAXONOMY[currentCategory] ? currentCategory : "";
  if (nextCategory !== currentCategory) {
    adminCategorySelect.value = "";
  }

  populateSubcategoryOptions(nextCategory, currentSubcategory);
}

function getProductById(id) {
  return products.find((product) => product.id === id);
}

function getBrandById(id) {
  return brands.find((brand) => brand.id === id);
}

function resetProductFormState() {
  editingProductId = null;
  if (adminProductIdField) {
    adminProductIdField.value = "";
  }
  if (adminProductSubmitButton) {
    adminProductSubmitButton.textContent = "Aggiungi prodotto";
  }
  if (adminProductCancelEditButton) {
    adminProductCancelEditButton.hidden = true;
  }
  if (adminProductFormStatus) {
    adminProductFormStatus.textContent =
      "I prodotti vengono salvati nel database del sito e restano disponibili anche dopo il riavvio.";
  }
  const showcaseField = document.querySelector("#admin-showcase");
  if (showcaseField) {
    showcaseField.checked = true;
  }
  hydrateAdminCategorySelects();
}

function startProductEdit(id) {
  const product = getProductById(id);
  if (!product || !adminForm) return;

  editingProductId = product.id;
  if (adminProductIdField) {
    adminProductIdField.value = product.id;
  }

  const setValue = (selector, value) => {
    const field = adminForm.querySelector(selector);
    if (field) field.value = value || "";
  };

  setValue("#admin-name", product.name);
  setValue("#admin-brand", product.brand);
  setValue("#admin-subtitle", product.subtitle);
  setValue("#admin-price", product.price);
  setValue("#admin-tags", Array.isArray(product.tags) ? product.tags.join(", ") : "");
  setValue("#admin-description", product.description);
  setValue("#admin-image", product.image);
  setValue("#admin-image-file", "");

  if (adminCategorySelect) {
    adminCategorySelect.value = product.category || "";
  }
  populateSubcategoryOptions(product.category || "", product.subcategory || "");

  const showcaseField = document.querySelector("#admin-showcase");
  if (showcaseField) {
    showcaseField.checked = Boolean(product.showcase);
  }

  if (adminProductSubmitButton) {
    adminProductSubmitButton.textContent = "Salva modifiche prodotto";
  }
  if (adminProductCancelEditButton) {
    adminProductCancelEditButton.hidden = false;
  }
  if (adminProductFormStatus) {
    adminProductFormStatus.textContent =
      "Stai modificando un prodotto gia presente nel catalogo. Salvando, il catalogo viene aggiornato mantenendo lo stesso prodotto.";
  }

  adminForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getHomepageProducts() {
  return products.filter((product) => product.showcase);
}

function filteredProducts(sourceProducts = products) {
  return sourceProducts.filter((product) => {
    const matchesCategory = activeCategory === "Tutti" || product.category === activeCategory;
    const haystack =
      `${product.name} ${product.category} ${product.subcategory} ${product.brand} ${product.subtitle} ${product.description} ${product.tags.join(" ")}`
        .toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  });
}

function toggleCart(open) {
  if (!cartDrawer || !backdrop) return;
  cartDrawer.classList.toggle("is-open", open);
  cartDrawer.setAttribute("aria-hidden", String(!open));
  backdrop.hidden = !open;
}

function ensureProductInfoModal() {
  if (productInfoModal) return productInfoModal;

  const modal = document.createElement("div");
  modal.className = "product-info-modal";
  modal.id = "product-info-modal";
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="product-info-modal__backdrop" data-close-product-info="true"></div>
    <div class="product-info-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="product-info-title">
      <button class="product-info-modal__close" type="button" aria-label="Chiudi scheda prodotto" data-close-product-info="true">&times;</button>
      <div class="product-info-modal__media">
        <img id="product-info-image" src="" alt="" loading="lazy" />
      </div>
      <div class="product-info-modal__content">
        <div class="product-info-modal__eyebrow" id="product-info-eyebrow"></div>
        <h3 id="product-info-title"></h3>
        <p class="product-info-modal__subtitle" id="product-info-subtitle"></p>
        <div class="product-info-modal__meta" id="product-info-meta"></div>
        <p class="product-info-modal__description" id="product-info-description"></p>
        <div class="product-info-modal__tags" id="product-info-tags"></div>
        <div class="product-info-modal__footer">
          <strong id="product-info-price"></strong>
          <button class="primary-button" type="button" id="product-info-add-to-cart">Aggiungi al carrello</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-product-info='true']")) {
      closeProductInfoModal();
    }
  });

  modal.querySelector("#product-info-add-to-cart")?.addEventListener("click", () => {
    const productId = modal.dataset.productId;
    if (!productId) return;
    addToCart(productId);
    closeProductInfoModal();
  });

  productInfoModal = modal;
  return modal;
}

function closeProductInfoModal() {
  const modal = ensureProductInfoModal();
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  modal.dataset.productId = "";
  document.body.classList.remove("modal-open");
}

function openProductInfoModal(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const modal = ensureProductInfoModal();
  modal.dataset.productId = product.id;

  const image = modal.querySelector("#product-info-image");
  const eyebrow = modal.querySelector("#product-info-eyebrow");
  const title = modal.querySelector("#product-info-title");
  const subtitle = modal.querySelector("#product-info-subtitle");
  const meta = modal.querySelector("#product-info-meta");
  const description = modal.querySelector("#product-info-description");
  const tags = modal.querySelector("#product-info-tags");
  const price = modal.querySelector("#product-info-price");

  if (image) {
    image.src = getProductImageSource(product);
    image.alt = product.name;
    image.onerror = () => {
      image.onerror = null;
      image.src = createPlaceholderImage(product.name);
    };
  }

  if (eyebrow) {
    eyebrow.textContent = [product.brand || "Zenit", product.category || "Catalogo"].filter(Boolean).join(" • ");
  }

  if (title) {
    title.textContent = product.name || "Scheda prodotto";
  }

  if (subtitle) {
    subtitle.textContent = product.subtitle || product.subcategory || "Soluzione professionale disponibile nel catalogo Zenit.";
  }

  if (meta) {
    meta.innerHTML = `
      ${product.category ? `<span>${product.category}</span>` : ""}
      ${product.subcategory ? `<span>${product.subcategory}</span>` : ""}
      ${product.brand ? `<span>${product.brand}</span>` : ""}
    `;
  }

  if (description) {
    description.textContent =
      product.description ||
      "Prodotto presente nel catalogo Zenit. Contattaci per dettagli tecnici, disponibilita e configurazione piu adatta.";
  }

  if (tags) {
    tags.innerHTML = Array.isArray(product.tags) && product.tags.length
      ? product.tags.map((tag) => `<span>${tag}</span>`).join("")
      : "<span>Catalogo Zenit</span>";
  }

  if (price) {
    price.textContent = formatPrice(product.price || 0);
  }

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function syncCartWithProducts() {
  const productIds = new Set(products.map((product) => product.id));
  cart = cart.filter((entry) => productIds.has(entry.id));
  saveCart();
}

function renderBrands() {
  if (!brandsTrack) return;

  if (!brands.length) {
    brandsTrack.innerHTML = `
      <article class="empty-state empty-state--wide">
        <h3>Nessun brand inserito</h3>
        <p>Aggiungi i logo brand dall'area admin per popolare la fascia partner della homepage.</p>
      </article>
    `;
    return;
  }

  const trackMarkup = brands
    .map(
      (brand) => `
        <article class="brand-chip">
          <div class="brand-chip__logo">
            ${
              brand.website
                ? `<a class="brand-chip__link" href="${brand.website}" target="_blank" rel="noreferrer" aria-label="Apri il sito di ${brand.name}">
            <img src="${brand.logo || createBrandPlaceholder(brand.name)}" alt="Logo ${brand.name}" loading="lazy" />
          </a>`
                : `<img src="${brand.logo || createBrandPlaceholder(brand.name)}" alt="Logo ${brand.name}" loading="lazy" />`
            }
          </div>
        </article>
      `
    )
    .join("");

  brandsTrack.innerHTML = `
    <div class="brands-track__lane">
      ${trackMarkup}
      ${trackMarkup}
    </div>
  `;
}

function renderFilters() {
  if (!categoryFilters) return;

  const categories = getCategories();
  if (!categories.includes(activeCategory)) {
    activeCategory = "Tutti";
  }

  categoryFilters.innerHTML = categories
    .map(
      (category) => `
        <button type="button" data-category="${category}" class="${category === activeCategory ? "is-active" : ""}">
          ${category}
        </button>
      `
    )
    .join("");
}

function renderProducts() {
  if (!productGrid) return;

  const sourceProducts = currentPage === "catalog" ? products : getHomepageProducts();
  const visibleProducts = filteredProducts(sourceProducts);

  if (heroProductCount) {
    heroProductCount.textContent = String(products.length);
  }

  if (!visibleProducts.length) {
    productGrid.innerHTML = `
      <article class="empty-state empty-state--wide">
        <h3>${currentPage === "catalog" ? "Catalogo vuoto" : "Nessun prodotto in vetrina"}</h3>
        <p>${
          currentPage === "catalog"
            ? "Usa la sezione admin per aggiungere i prodotti che vuoi mostrare nel catalogo."
            : "Seleziona nell'admin i prodotti che vuoi mettere in evidenza nella homepage."
        }</p>
      </article>
    `;
    return;
  }

  productGrid.innerHTML = visibleProducts
    .map(
      (product, index) => `
        <article class="product-card ${index === 0 ? "product-card--frame-example" : ""}">
          <div class="product-card__frame" aria-hidden="true">
            <span class="product-card__corner product-card__corner--tl"></span>
            <span class="product-card__corner product-card__corner--tr"></span>
            <span class="product-card__corner product-card__corner--bl"></span>
            <span class="product-card__corner product-card__corner--br"></span>
            ${index === 0 ? '<span class="product-card__frame-badge">Esempio cornice Zenit</span>' : ""}
          </div>
          <div class="product-card__image">
            <span class="product-badge">${product.tags[0] || "Catalogo"}</span>
            <div class="product-tags">${product.tags
              .slice(1, 3)
              .map((tag) => `<span>${tag}</span>`)
              .join("")}</div>
            <img src="${getProductImageSource(product)}" alt="${product.name}" loading="lazy" data-product-name="${product.name}" />
          </div>
          <span class="product-brand">${product.brand || "ZENIT"}</span>
          <h3>${product.name}</h3>
          <p class="product-subtitle">${product.subtitle || product.description || "Prodotto catalogo Zenit"}</p>
          <span class="product-request">${product.subcategory || product.category || "Catalogo"}</span>
          <strong class="product-price">${formatPrice(product.price || 0)}</strong>
          <div class="product-actions">
            <button class="ghost-button" type="button" data-product-info="${product.id}">${product.description ? "Info prodotto" : "Dettagli"}</button>
            <button class="primary-button add-to-cart" type="button" data-id="${product.id}">Aggiungi al carrello</button>
          </div>
        </article>
      `
    )
    .join("");

  productGrid.querySelectorAll(".product-card__image img").forEach((image) => {
    image.addEventListener(
      "error",
      () => {
        image.src = createPlaceholderImage(image.dataset.productName || "Zenit");
      },
      { once: true }
    );
  });
}

function renderHeroCatalogPreview() {
  if (!heroProductCount && !heroCatalogProduct) return;

  const showcaseProducts = getHomepageProducts();
  const totalPublished = products.length;
  const featuredProduct = showcaseProducts[0] || products[0] || null;
  const rotationProducts = showcaseProducts.length ? showcaseProducts : products;

  stopHeroCatalogRotation();

  if (heroProductCount) {
    heroProductCount.textContent = String(totalPublished);
  }

  if (heroProductCountInline) {
    heroProductCountInline.textContent = String(totalPublished);
  }

  if (!heroCatalogEmpty || !heroCatalogProduct || !featuredProduct) {
    if (heroCatalogEmpty) {
      heroCatalogEmpty.hidden = false;
    }
    if (heroCatalogProduct) {
      heroCatalogProduct.hidden = true;
    }
    return;
  }

  heroCatalogEmpty.hidden = true;
  heroCatalogProduct.hidden = false;

  if (heroProductImage) {
    heroProductImage.src = getProductImageSource(featuredProduct);
    heroProductImage.alt = featuredProduct.name || "Prodotto Zenit";
    heroProductImage.onerror = () => {
      heroProductImage.onerror = null;
      heroProductImage.src = createPlaceholderImage(featuredProduct.name);
    };
  }

  if (heroProductMeta) {
    heroProductMeta.textContent = [featuredProduct.brand || "Zenit", featuredProduct.category || "Catalogo"]
      .filter(Boolean)
      .join(" • ");
  }

  if (heroProductName) {
    heroProductName.textContent = featuredProduct.name || "Prodotto in evidenza";
  }

  if (heroProductSubtitle) {
    heroProductSubtitle.textContent =
      featuredProduct.subtitle ||
      featuredProduct.subcategory ||
      featuredProduct.description ||
      "Prodotto disponibile nel catalogo dinamico Zenit.";
  }
}

function stopHeroCatalogRotation() {
  if (!heroCatalogRotationTimer) return;
  window.clearInterval(heroCatalogRotationTimer);
  heroCatalogRotationTimer = null;
}

function applyHeroCatalogProduct(featuredProduct, totalPublished) {
  if (!featuredProduct || !heroCatalogProduct) return;

  if (heroProductCountInline) {
    heroProductCountInline.textContent = String(totalPublished);
  }

  if (heroProductImage) {
    heroProductImage.src = getProductImageSource(featuredProduct);
    heroProductImage.alt = featuredProduct.name || "Prodotto Zenit";
    heroProductImage.onerror = () => {
      heroProductImage.onerror = null;
      heroProductImage.src = createPlaceholderImage(featuredProduct.name);
    };
  }

  if (heroProductMeta) {
    heroProductMeta.textContent = [featuredProduct.brand || "Zenit", featuredProduct.category || "Catalogo"]
      .filter(Boolean)
      .join(" • ");
  }

  if (heroProductName) {
    heroProductName.textContent = featuredProduct.name || "Prodotto in evidenza";
  }

  if (heroProductSubtitle) {
    heroProductSubtitle.textContent =
      featuredProduct.subtitle ||
      featuredProduct.subcategory ||
      featuredProduct.description ||
      "Prodotto disponibile nel catalogo dinamico Zenit.";
  }
}

function rotateHeroCatalogProduct(showcaseProducts, totalPublished) {
  if (!heroCatalogProduct || showcaseProducts.length <= 1) return;
  heroCatalogRotationIndex = (heroCatalogRotationIndex + 1) % showcaseProducts.length;
  heroCatalogProduct.classList.add("is-rotating");

  window.setTimeout(() => {
    applyHeroCatalogProduct(showcaseProducts[heroCatalogRotationIndex], totalPublished);
    heroCatalogProduct.classList.remove("is-rotating");
  }, 220);
}

function renderHeroCatalogPreview() {
  if (!heroProductCount && !heroCatalogProduct) return;

  const showcaseProducts = getHomepageProducts();
  const totalPublished = products.length;
  const featuredProduct = showcaseProducts[0] || products[0] || null;
  const rotationProducts = showcaseProducts.length ? showcaseProducts : products;

  stopHeroCatalogRotation();

  if (heroProductCount) {
    heroProductCount.textContent = String(totalPublished);
  }

  if (heroProductCountInline) {
    heroProductCountInline.textContent = String(totalPublished);
  }

  if (!heroCatalogEmpty || !heroCatalogProduct || !featuredProduct) {
    if (heroCatalogEmpty) {
      heroCatalogEmpty.hidden = false;
    }
    if (heroCatalogProduct) {
      heroCatalogProduct.hidden = true;
    }
    return;
  }

  heroCatalogEmpty.hidden = true;
  heroCatalogProduct.hidden = false;
  heroCatalogRotationIndex = Math.min(heroCatalogRotationIndex, Math.max(rotationProducts.length - 1, 0));
  applyHeroCatalogProduct(rotationProducts[heroCatalogRotationIndex] || featuredProduct, totalPublished);

  if (rotationProducts.length > 1) {
    heroCatalogRotationTimer = window.setInterval(() => {
      rotateHeroCatalogProduct(rotationProducts, totalPublished);
    }, 3600);
  }
}

function renderAdminList() {
  if (!adminProductCount || !adminProductList) return;

  adminProductCount.textContent = `${products.length} ${products.length === 1 ? "prodotto" : "prodotti"}`;

  if (!products.length) {
    adminProductList.innerHTML = `
      <article class="empty-state">
        <h3>Nessun prodotto inserito</h3>
        <p>Compila il form a sinistra per creare il primo elemento del catalogo.</p>
      </article>
    `;
    return;
  }

  adminProductList.innerHTML = products
    .map(
      (product) => `
        <article class="admin-product-row">
          <div class="admin-product-row__copy">
            <strong>${product.name}</strong>
            <p>${product.brand || "Brand"} • ${product.category || "Categoria"} • ${formatPrice(product.price || 0)}</p>
            <span class="admin-product-row__meta">${product.showcase ? "In vetrina home" : "Solo catalogo completo"}</span>
          </div>
          <div class="admin-product-row__actions">
            <button class="ghost-button" type="button" data-edit-product="${product.id}">Modifica</button>
            <button class="ghost-button admin-toggle" type="button" data-toggle-showcase="${product.id}">
              ${product.showcase ? "Rimuovi vetrina" : "Metti in vetrina"}
            </button>
            <button class="ghost-button admin-delete" type="button" data-delete="${product.id}">Elimina</button>
          </div>
        </article>
      `
    )
    .join("");

  adminProductList.querySelectorAll(".admin-product-row").forEach((row, index) => {
    const product = products[index];
    const summary = row.querySelector(".admin-product-row__copy p");
    if (!product || !summary) return;
    summary.textContent = `${product.brand || "Brand"} - ${product.category || "Categoria"}${
      product.subcategory ? ` / ${product.subcategory}` : ""
    } - ${formatPrice(product.price || 0)}`;
  });
}

function renderAdminBrands() {
  if (!brandCount || !adminBrandList) return;

  brandCount.textContent = `${brands.length} ${brands.length === 1 ? "brand" : "brand"}`;

  if (!brands.length) {
    adminBrandList.innerHTML = `
      <article class="empty-state">
        <h3>Nessun brand inserito</h3>
        <p>Compila il form brand per aggiungere i logo partner nella fascia scorrevole della homepage.</p>
      </article>
    `;
    return;
  }

  adminBrandList.innerHTML = brands
    .map(
      (brand) => `
        <article class="admin-brand-row">
          <div class="admin-brand-row__logo">
            <img src="${brand.logo || createBrandPlaceholder(brand.name)}" alt="Logo ${brand.name}" loading="lazy" />
          </div>
          <div class="admin-brand-row__copy">
            <strong>${brand.name}</strong>
            <p>${brand.label || "Partner tecnico Zenit"}</p>
            <div class="admin-brand-row__meta">
              ${
                brand.website
                  ? `<a class="admin-brand-row__link" href="${brand.website}" target="_blank" rel="noreferrer">Sito ufficiale</a>`
                  : ""
              }
              ${
                brand.email
                  ? `<span class="admin-brand-row__mini">Email collegata</span>`
                  : ""
              }
            </div>
            ${
              brand.notes
                ? `<span class="admin-brand-row__notes">${brand.notes}</span>`
                : `<span class="admin-brand-row__notes">Nessuna nota conoscitiva salvata per Carlo 2.0.</span>`
            }
          </div>
          <div class="admin-brand-row__actions">
            <button class="ghost-button" type="button" data-edit-brand="${brand.id}">Modifica</button>
            <button class="ghost-button admin-delete" type="button" data-delete-brand="${brand.id}">Elimina</button>
          </div>
        </article>
      `
    )
    .join("");
}

function addToCart(id) {
  const product = getProductById(id);
  if (!product) return;

  const item = cart.find((entry) => entry.id === id);
  if (item) item.quantity += 1;
  else cart.push({ id, quantity: 1 });

  saveCart();
  renderCart();
  toggleCart(true);
}

function removeFromCart(id) {
  cart = cart.filter((entry) => entry.id !== id);
  saveCart();
  renderCart();
}

function updateCartQuantity(id, delta) {
  cart = cart
    .map((entry) => (entry.id === id ? { ...entry, quantity: Math.max(0, entry.quantity + delta) } : entry))
    .filter((entry) => entry.quantity > 0);
  saveCart();
  renderCart();
}

function setCartQuantity(id, quantity) {
  const safeQuantity = Math.max(1, Number(quantity) || 1);
  cart = cart.map((entry) => (entry.id === id ? { ...entry, quantity: safeQuantity } : entry));
  saveCart();
  renderCart();
}

function buildCartRequestMessage() {
  const currentUser = getCurrentUser();
  const detailedItems = cart
    .map((entry) => {
      const product = getProductById(entry.id);
      return product ? { ...product, quantity: entry.quantity } : null;
    })
    .filter(Boolean);

  if (!detailedItems.length) return null;

  const totalAmount = detailedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const lines = detailedItems.map(
    (item) =>
      `- ${item.name} | categoria: ${item.category || "Catalogo"} | qta: ${item.quantity} | subtotale: ${formatPrice(
        item.price * item.quantity
      )}`
  );

  return [
    "Buongiorno Zenit,",
    "",
    currentUser ? `utente: ${currentUser.name} - email: ${currentUser.email}` : "utente non autenticato",
    "",
    "vorrei richiedere una proposta per questi prodotti:",
    ...lines,
    "",
    `Totale indicativo carrello: ${formatPrice(totalAmount)}`,
    "",
    "Attendo un vostro riscontro commerciale."
  ].join("\n");
}

function createOrderFromCart() {
  const currentUser = getCurrentUser();
  const detailedItems = cart
    .map((entry) => {
      const product = getProductById(entry.id);
      return product ? { ...product, quantity: entry.quantity } : null;
    })
    .filter(Boolean);

  if (!detailedItems.length) return null;

  const totalAmount = detailedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const now = new Date();
  const order = {
    id: `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${now.getTime()}`,
    createdAt: now.toISOString(),
    status: "Richiesta inviata",
    totalAmount,
    items: detailedItems.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      brand: item.brand,
      price: item.price,
      quantity: item.quantity
    })),
    userId: currentUser?.id || null,
    userName: currentUser?.name || "Utente ospite",
    userEmail: currentUser?.email || ""
  };
  return order;
}

async function startCartCheckout() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    const returnTarget = `${window.location.pathname.split("/").pop() || "index.html"}${window.location.search || ""}${window.location.hash || ""}`;
    setUserRedirectTarget(returnTarget);
    window.location.href = "auth.html";
    return;
  }

  const message = buildCartRequestMessage();
  if (!message) {
    toggleCart(true);
    return;
  }

  const order = createOrderFromCart();
  await apiFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify(order)
  });
  await bootstrapApp();
  cart = [];
  saveCart();
  renderCart();

  const mailto = `mailto:commerciale@zenitsrl.it?subject=${encodeURIComponent(
    "Richiesta ordine dal sito Zenit"
  )}&body=${encodeURIComponent(message)}`;
  window.location.href = mailto;
}

function renderOrdersPage() {
  if (!ordersList || !ordersCount || !ordersPageMessage) return;

  const currentUser = getCurrentUser();
  if (!currentUser) {
    ordersCount.textContent = "0 ordini";
    ordersPageMessage.textContent = "Accedi o registrati per visualizzare i tuoi ordini salvati.";
    ordersList.innerHTML = `
      <article class="empty-state empty-state--wide">
        <h3>Area ordini riservata</h3>
        <p>Per vedere lo storico richieste devi entrare con il tuo account Zenit.</p>
        <a class="primary-button" href="auth.html">Accedi o registrati</a>
      </article>
    `;
    return;
  }

  const userOrders = orders.filter((order) => order.userId === currentUser.id);
  ordersCount.textContent = `${userOrders.length} ${userOrders.length === 1 ? "ordine" : "ordini"}`;
  ordersPageMessage.textContent = `Qui trovi lo storico delle richieste ordine inviate come ${currentUser.name}.`;

  if (!userOrders.length) {
    ordersList.innerHTML = `
      <article class="empty-state empty-state--wide">
        <h3>Nessun ordine registrato</h3>
        <p>Quando invii una richiesta dal carrello, la troverai qui con data, riepilogo e stato.</p>
        <a class="primary-button" href="catalogo.html">Vai al catalogo</a>
      </article>
    `;
    return;
  }

  ordersList.innerHTML = userOrders
    .map(
      (order) => `
        <article class="order-card">
          <div class="order-card__head">
            <div>
              <p class="order-card__eyebrow">${order.id}</p>
              <h3>${formatOrderDate(order.createdAt)}</h3>
            </div>
            <span class="order-card__status">${order.status}</span>
          </div>
          <div class="order-card__meta">
            <span>${order.items.length} ${order.items.length === 1 ? "articolo" : "articoli"}</span>
            <span>${formatPrice(order.totalAmount)}</span>
          </div>
          <div class="order-card__items">
            ${order.items
              .map(
                (item) => `
                  <div class="order-line">
                    <strong>${item.name}</strong>
                    <span>${item.category || "Catalogo"} • qta ${item.quantity} • ${formatPrice(item.price * item.quantity)}</span>
                  </div>
                `
              )
              .join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function renderAdminOrders() {
  if (!adminOrdersList || !adminOrdersCount) return;

  adminOrdersCount.textContent = `${orders.length} ${orders.length === 1 ? "ordine" : "ordini"}`;

  if (!orders.length) {
    adminOrdersList.innerHTML = `
      <article class="empty-state">
        <h3>Nessun ordine registrato</h3>
        <p>Quando un utente invia una richiesta dal carrello, comparira qui con il suo stato.</p>
      </article>
    `;
    return;
  }

  adminOrdersList.innerHTML = orders
    .map(
      (order) => `
        <article class="admin-order-row">
          <div class="admin-order-row__copy">
            <strong>${order.id}</strong>
            <p>${order.userName}${order.userEmail ? ` • ${order.userEmail}` : ""}</p>
            <span class="admin-order-row__meta">${formatOrderDate(order.createdAt)} • ${order.items.length} ${order.items.length === 1 ? "articolo" : "articoli"} • ${formatPrice(order.totalAmount)}</span>
          </div>
          <div class="admin-order-row__actions">
            <label class="admin-order-row__label" for="order-status-${order.id}">Stato</label>
            <select id="order-status-${order.id}" data-order-status="${order.id}">
              ${ORDER_STATUSES.map((status) => `<option value="${status}" ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}
            </select>
          </div>
        </article>
      `
    )
    .join("");
}

async function updateOrderStatus(orderId, nextStatus) {
  await apiFetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: nextStatus })
  });
  await bootstrapApp();
}

function renderCart() {
  if (!cartCount || !cartTotal || !cartItems) return;

  const detailedItems = cart
    .map((entry) => {
      const product = getProductById(entry.id);
      return product ? { ...product, quantity: entry.quantity } : null;
    })
    .filter(Boolean);

  const totalQuantity = detailedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = detailedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  cartCount.textContent = totalQuantity;
  cartTotal.textContent = formatPrice(totalAmount);

  if (cartCheckoutButton) {
    cartCheckoutButton.disabled = !detailedItems.length;
  }

  if (!detailedItems.length) {
    cartItems.innerHTML = `
      <article class="empty-state">
        <h3>Il carrello e vuoto</h3>
        <p>Aggiungi un prodotto dal catalogo dinamico per simularne l'acquisto.</p>
      </article>
    `;
    return;
  }

  cartItems.innerHTML = detailedItems
    .map(
      (item) => `
        <article class="cart-row">
          <div class="cart-row__copy">
            <strong>${item.name}</strong>
            <p>${item.category || "Catalogo"} • ${item.brand || "Zenit"}</p>
            <div class="cart-quantity" aria-label="Quantita prodotto">
              <button type="button" data-quantity-change="${item.id}" data-delta="-1">−</button>
              <input type="number" min="1" value="${item.quantity}" data-quantity-input="${item.id}" aria-label="Quantita ${item.name}" />
              <button type="button" data-quantity-change="${item.id}" data-delta="1">+</button>
            </div>
            <p>${item.category || "Catalogo"} • Quantita ${item.quantity}</p>
          </div>
          <div class="cart-row__actions">
            <span class="cart-row__unit-price">${formatPrice(item.price)} cad.</span>
            <strong>${formatPrice(item.price * item.quantity)}</strong>
            <button type="button" data-remove="${item.id}">Rimuovi</button>
          </div>
        </article>
      `
    )
    .join("");

  cartItems.querySelectorAll("[data-quantity-change][data-delta='-1']").forEach((button) => {
    button.textContent = "-";
  });

  cartItems.querySelectorAll(".cart-row__copy p").forEach((paragraph, index, paragraphs) => {
    if (index > 0 || paragraph.textContent.includes("Quantita")) {
      paragraph.remove();
    }
  });
}

function refreshAll() {
  syncCartWithProducts();
  renderBrands();
  renderFilters();
  renderProducts();
  renderHeroCatalogPreview();
  renderOrdersPage();
  renderAdminOrders();
  renderAdminList();
  renderAdminBrands();
  renderCart();
  bindScenicCards();
  syncAdminView();
  syncBrandKnowledgePreview();
}

function syncBrandKnowledgePreview() {
  if (!brandKnowledgePreview) return;
  if (!brands.length) {
    brandKnowledgePreview.value =
      "Quando salvi un brand, Carlo 2.0 prova ad apprendere automaticamente dal sito ufficiale e dall'email aziendale collegata.";
    return;
  }
  brandKnowledgePreview.value = brands[0]?.notes || "Brand salvato, ma Carlo 2.0 non ha ancora trovato abbastanza segnali automatici.";
}

function resetBrandFormState() {
  editingBrandId = null;
  if (brandIdField) {
    brandIdField.value = "";
  }
  if (brandSubmitButton) {
    brandSubmitButton.textContent = "Aggiungi brand";
  }
  if (brandCancelEditButton) {
    brandCancelEditButton.hidden = true;
  }
  if (brandFormStatus) {
    brandFormStatus.textContent =
      "I brand aggiunti qui scorrono nella fascia partner del sito e fanno apprendere automaticamente Carlo 2.0 dal dominio aziendale collegato.";
  }
}

function startBrandEdit(id) {
  const brand = getBrandById(id);
  if (!brand || !brandForm) return;

  editingBrandId = brand.id;
  if (brandIdField) {
    brandIdField.value = brand.id;
  }

  const setValue = (selector, value) => {
    const field = brandForm.querySelector(selector);
    if (field) field.value = value || "";
  };

  setValue("#brand-name", brand.name);
  setValue("#brand-label", brand.label);
  setValue("#brand-website", brand.website);
  setValue("#brand-email", brand.email);
  setValue("#brand-logo", brand.logo);

  const fileField = brandForm.querySelector("#brand-logo-file");
  if (fileField) {
    fileField.value = "";
  }
  if (brandKnowledgePreview) {
    brandKnowledgePreview.value = brand.notes || "Questo brand non ha ancora conoscenza automatica sufficiente.";
  }
  if (brandSubmitButton) {
    brandSubmitButton.textContent = "Salva modifiche brand";
  }
  if (brandCancelEditButton) {
    brandCancelEditButton.hidden = false;
  }
  if (brandFormStatus) {
    brandFormStatus.textContent =
      "Stai modificando un brand esistente. Salvando, Carlo 2.0 ricalcola automaticamente le informazioni dal sito e dall'email collegata.";
  }
  brandForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function syncAdminView() {
  const isOpen = isAdminAuthenticated();
  if (adminLoginPanel) {
    adminLoginPanel.hidden = isOpen;
  }
  if (adminProtected) {
    adminProtected.hidden = !isOpen;
  }
  syncAssistantAdminState();
}

function setAdminLoginFeedback(message, isError = false) {
  if (adminLoginMessage) {
    adminLoginMessage.textContent = message;
    adminLoginMessage.classList.toggle("is-error", isError);
  }
}

function setUserAuthFeedback(target, message, isError = false) {
  if (!target) return;
  target.textContent = message;
  target.classList.toggle("is-error", isError);
}

async function handleUserRegisterSubmit(event, formElement) {
  event.preventDefault();
  const formData = new FormData(formElement);
  const name = String(formData.get("name") || "").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") || "");

  if (!name || !email || password.length < 6) {
    setUserAuthFeedback(userRegisterMessage, "Compila tutti i campi e usa una password di almeno 6 caratteri.", true);
    return;
  }

  try {
    await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        id: `${slugify(name)}-${Date.now()}`,
        name,
        email,
        password
      })
    });
    await bootstrapApp();
    setUserAuthFeedback(userRegisterMessage, "Registrazione completata. Ora sei connesso al sito Zenit.");
    userRegisterForm?.reset();
    const redirectTarget = getUserRedirectTarget() || formElement?.dataset.redirect || "index.html";
    setUserRedirectTarget(null);
    window.setTimeout(() => {
      window.location.href = redirectTarget;
    }, 260);
  } catch (error) {
    setUserAuthFeedback(userRegisterMessage, error.message || "Registrazione non riuscita.", true);
  }
}

async function handleUserLoginSubmit(event, formElement) {
  event.preventDefault();
  const formData = new FormData(formElement);
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") || "");

  try {
    await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    await bootstrapApp();
    setUserAuthFeedback(userLoginMessage, "Accesso eseguito. Ti sto riportando sul sito.");
    userLoginForm?.reset();
    const redirectTarget = getUserRedirectTarget() || formElement?.dataset.redirect || "index.html";
    setUserRedirectTarget(null);
    window.setTimeout(() => {
      window.location.href = redirectTarget;
    }, 260);
  } catch (error) {
    setUserAuthFeedback(userLoginMessage, error.message || "Credenziali non valide. Controlla email e password.", true);
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleAdminSubmit(event) {
  event.preventDefault();
  const formData = new FormData(adminForm);
  const file = formData.get("imageFile");
  let image = String(formData.get("image") || "").trim();

  if (file && file.size) {
    image = await readFileAsDataUrl(file);
  }

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const subcategory = String(formData.get("subcategory") || "").trim();
  const brand = String(formData.get("brand") || "").trim();
  const subtitle = String(formData.get("subtitle") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const price = Number(formData.get("price") || 0);
  const showcase = formData.get("showcase") === "on";

  const product = normalizeProduct({
    id: editingProductId || `${slugify(name)}-${Date.now()}`,
    name,
    category,
    subcategory,
    brand,
    subtitle,
    description,
    tags,
    price,
    image: isRenderableImageSource(image) ? image : createPlaceholderImage(name),
    showcase
  });

  try {
    await apiFetch(editingProductId ? `/api/products/${encodeURIComponent(editingProductId)}` : "/api/products", {
      method: editingProductId ? "PATCH" : "POST",
      body: JSON.stringify(product)
    });
    await bootstrapApp();
    adminForm.reset();
    resetProductFormState();
  } catch (error) {
    window.alert(error.message || "Non sono riuscito a salvare il prodotto.");
  }
}

async function handleBrandSubmit(event) {
  event.preventDefault();
  const formData = new FormData(brandForm);
  const file = formData.get("brandLogoFile");
  let logo = String(formData.get("brandLogo") || "").trim();

  if (file && file.size) {
    logo = await readFileAsDataUrl(file);
  }

  const name = String(formData.get("brandName") || "").trim();
  const label = String(formData.get("brandLabel") || "").trim();
  const website = String(formData.get("brandWebsite") || "").trim();
  const email = String(formData.get("brandEmail") || "").trim();

  const brand = normalizeBrand({
    id: editingBrandId || `${slugify(name)}-${Date.now()}`,
    name,
    label,
    logo: logo || createBrandPlaceholder(name),
    website,
    email,
    notes: "",
    knowledgeUpdatedAt: new Date().toISOString()
  });

  try {
    await apiFetch(editingBrandId ? `/api/brands/${encodeURIComponent(editingBrandId)}` : "/api/brands", {
      method: editingBrandId ? "PATCH" : "POST",
      body: JSON.stringify(brand)
    });
    await bootstrapApp();
    brandForm.reset();
    resetBrandFormState();
    syncBrandKnowledgePreview();
  } catch (error) {
    window.alert(error.message || "Non sono riuscito a salvare il brand.");
  }
}

async function handleDeleteProduct(id) {
  try {
    await apiFetch(`/api/products/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
    await bootstrapApp();
    if (editingProductId === id) {
      adminForm?.reset();
      resetProductFormState();
    }
  } catch (error) {
    window.alert(error.message || "Non sono riuscito a eliminare il prodotto.");
  }
}

async function handleDeleteBrand(id) {
  try {
    await apiFetch(`/api/brands/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
    await bootstrapApp();
    if (editingBrandId === id) {
      brandForm?.reset();
      resetBrandFormState();
      syncBrandKnowledgePreview();
    }
  } catch (error) {
    window.alert(error.message || "Non sono riuscito a eliminare il brand.");
  }
}

async function handleToggleShowcase(id) {
  try {
    await apiFetch(`/api/products/${encodeURIComponent(id)}/showcase`, {
      method: "PATCH",
      body: JSON.stringify({})
    });
    await bootstrapApp();
  } catch (error) {
    window.alert(error.message || "Non sono riuscito ad aggiornare la vetrina.");
  }
}

function bindScenicCards() {
  const scenicCards = document.querySelectorAll(
    ".story-stat-card, .love-card, .method-strip__inner article, .area-card, .product-card, .sectors-grid article, .brand-chip, .highlight-card, .catalog-hero__panel"
  );

  scenicCards.forEach((card) => {
    if (card.dataset.scenicBound === "true") return;
    card.dataset.scenicBound = "true";

    card.addEventListener("mousemove", (event) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * 10;
      const rotateX = (0.5 - py) * 10;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

function syncScrollChrome() {
  const scrollTop = window.scrollY || window.pageYOffset;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollHeight > 0 ? Math.min((scrollTop / scrollHeight) * 100, 100) : 0;
  const scrollDelta = scrollTop - lastScrollTop;

  if (scrollProgressBar) {
    scrollProgressBar.style.width = `${progress}%`;
  }

  if (mainHeader) {
    mainHeader.classList.toggle("is-condensed", scrollTop > 18);

    if (scrollTop <= 32) {
      headerRetracted = false;
    } else if (!headerRetracted && scrollDelta > 10 && scrollTop > 180) {
      headerRetracted = true;
    } else if (headerRetracted && scrollDelta < -10) {
      headerRetracted = false;
    }

    mainHeader.classList.toggle("is-retracted", headerRetracted);
  }

  lastScrollTop = Math.max(scrollTop, 0);
}

function requestScrollChromeSync() {
  if (scrollChromeFrame !== null) return;

  scrollChromeFrame = window.requestAnimationFrame(() => {
    scrollChromeFrame = null;
    syncScrollChrome();
  });
}

function animateCountUp(element) {
  if (!element || element.dataset.countAnimated === "true") return;

  const target = Number(element.dataset.count || 0);
  const suffix = element.dataset.suffix || "";
  const duration = 900;
  const startTime = performance.now();

  element.dataset.countAnimated = "true";

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    element.textContent = `${value}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = `${target}${suffix}`;
    }
  }

  requestAnimationFrame(step);
}

function setAssistantOpen(open) {
  if (!assistantToggle || !assistantPanel) return;
  const isOpen = Boolean(open);
  assistantPanel.hidden = !isOpen;
  assistantPanel.setAttribute("aria-hidden", String(!isOpen));
  assistantPanel.classList.toggle("is-open", isOpen);
  assistantToggle.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("assistant-open", isOpen);
  setAssistantStoredOpenState(isOpen);
  if (isOpen) {
    window.setTimeout(() => {
      assistantMessages?.scrollTo({ top: assistantMessages.scrollHeight, behavior: "smooth" });
      assistantInput?.scrollIntoView({ block: "nearest" });
    }, 80);
  }
}

function setCatalogNavOpen(open) {
  if (!catalogNav || !catalogNavToggle) return;
  catalogNav.classList.toggle("is-mobile-open", open);
  catalogNavToggle.setAttribute("aria-expanded", String(open));
}

function appendAssistantMessage(author, text, options = {}) {
  if (!assistantMessages) return;

  const article = document.createElement("article");
  article.className = `assistant-message assistant-message--${author}`;
  if (options.extraClassName) {
    article.classList.add(options.extraClassName);
  }

  const title = document.createElement("strong");
  title.textContent = author === "bot" ? "Carlo 2.0 • AI Settoriale Zenit" : "Tu";

  const body = document.createElement("p");
  body.textContent = text;

  article.appendChild(title);
  article.appendChild(body);

  if (Array.isArray(options.sources) && options.sources.length) {
    const sourcesWrap = document.createElement("div");
    sourcesWrap.className = "assistant-sources";

    options.sources.forEach((source) => {
      const link = document.createElement("a");
      link.className = "assistant-source";
      link.href = source.url || "#";
      link.target = "_blank";
      link.rel = "noreferrer";

      const label = document.createElement("strong");
      label.textContent = source.title || source.domain || "Fonte online";

      const snippet = document.createElement("span");
      snippet.textContent = source.snippet || source.domain || "";

      link.appendChild(label);
      if (snippet.textContent) {
        link.appendChild(snippet);
      }
      sourcesWrap.appendChild(link);
    });

    article.appendChild(sourcesWrap);
  }

  assistantMessages.appendChild(article);
  assistantMessages.scrollTop = assistantMessages.scrollHeight;
  return article;
}

function appendThinkingMessage() {
  if (!assistantMessages) return null;

  const article = document.createElement("article");
  article.className = "assistant-message assistant-message--bot assistant-message--thinking";

  const title = document.createElement("strong");
  title.textContent = "Carlo 2.0 • Analisi in corso";

  const body = document.createElement("p");
  body.textContent = "Sto organizzando la risposta";

  const dots = document.createElement("span");
  dots.className = "assistant-thinking-dots";
  dots.innerHTML = "<span></span><span></span><span></span>";

  body.appendChild(dots);
  article.appendChild(title);
  article.appendChild(body);
  assistantMessages.appendChild(article);
  assistantMessages.scrollTop = assistantMessages.scrollHeight;
  return article;
}

function syncAssistantAdminState() {
  const webMode = isAssistantWebModeEnabled();

  if (assistantAdminPanel) {
    assistantAdminPanel.hidden = true;
  }

  if (assistantWebModeToggle) {
    assistantWebModeToggle.checked = webMode;
    assistantWebModeToggle.disabled = true;
  }

  if (assistantStatusCopy) {
    assistantStatusCopy.textContent = webMode
      ? "AI settoriale + ricerca web attiva"
      : "AI settoriale Zenit attiva";
  }
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function syncAssistantViewportMetrics() {
  const visualHeight = window.visualViewport?.height || window.innerHeight;
  const offsetTop = window.visualViewport?.offsetTop || 0;
  document.documentElement.style.setProperty("--assistant-viewport-height", `${Math.max(visualHeight, 320)}px`);
  document.documentElement.style.setProperty("--assistant-viewport-offset-top", `${Math.max(offsetTop, 0)}px`);
}

function updateAssistantConversationState(nextState = {}) {
  assistantConversationState = {
    ...assistantConversationState,
    ...nextState
  };
}

function buildNeedProfile(question, knowledge) {
  const q = normalizeText(question);
  const riskKeywords = {
    quota: ["quota", "caduta", "altezza", "ponteggio", "copertura", "trabattello", "linea vita"],
    ex: ["atex", "ex", "gas", "esplosione", "zona classificata", "atmosfera esplosiva"],
    respirazione: ["respiratore", "respirazione", "fumi", "vapori", "polveri", "maschera filtrante"],
    visibilita: ["alta visibilita", "visibilita", "strada", "traffico", "notturno"],
    saldatura: ["saldatura", "saldatore", "maschera", "fumi di saldatura", "taglio"],
    spazio_confinato: ["spazio confinato", "cisterna", "serbatoio", "pozzo", "davit", "treppiede", "recupero"],
    chimico: ["chimico", "agenti chimici", "schizzi", "solventi", "laboratorio", "contaminazione"],
    comfort: ["comodo", "comoda", "leggerezza", "leggero", "molte ore", "ergonomia", "comfort"],
    mani: ["guanti", "mani", "taglio", "abrasione", "presa"],
    piede: ["scarpe", "scarpa", "calzature", "s3", "s1p", "piede"]
  };

  const matchedRisks = Object.entries(riskKeywords)
    .filter(([, terms]) => terms.some((term) => q.includes(normalizeText(term))))
    .map(([risk]) => risk);

  const urgency =
    /(urgente|subito|rapido|rapidamente|entro oggi|entro domani|in fretta)/.test(q) ? "high" : "normal";
  const quantity =
    /(squadra|operatori|dipendenti|lotto|fornitura|continuativa|ricorrente|piu persone)/.test(q)
      ? "team"
      : "single";
  const goal =
    /(consiglio|cosa mi consigli|da dove parto|orientami|guida|aiutami a scegliere)/.test(q)
      ? "advisory"
      : /(preventivo|offerta|quotazione)/.test(q)
        ? "quote"
        : /(prodotto|catalogo|comprare|acquistare|carrello)/.test(q)
          ? "shopping"
          : "general";

  const suggestedCategories = new Set();

  if (matchedRisks.includes("quota")) suggestedCategories.add("Anticaduta");
  if (matchedRisks.includes("ex")) suggestedCategories.add("ATEX");
  if (matchedRisks.includes("spazio_confinato")) suggestedCategories.add("Spazi Confinati");
  if (matchedRisks.includes("saldatura")) suggestedCategories.add("Saldatura");
  if (matchedRisks.includes("respirazione") || matchedRisks.includes("chimico") || matchedRisks.includes("mani")) {
    suggestedCategories.add("Antinfortunistica");
  }
  if (matchedRisks.includes("visibilita") || matchedRisks.includes("comfort") || matchedRisks.includes("piede")) {
    suggestedCategories.add("Calzature e Abbigliamento");
  }

  const sectorEntry = Object.entries(knowledge.sectorPlaybooks).find(([, sector]) =>
    sector.aliases.some((alias) => q.includes(normalizeText(alias)))
  );
  if (sectorEntry) {
    sectorEntry[1].recommendedCategories.forEach((category) => suggestedCategories.add(category));
  }

  return {
    matchedRisks,
    urgency,
    quantity,
    goal,
    suggestedCategories: [...suggestedCategories],
    detectedSectorKey: sectorEntry?.[0] || null
  };
}

function buildConsultativeReply({ knowledge, needProfile, matchedSector, matchedKnowledgeCategory, matchedMicrocategory }) {
  const focusLines = [];

  if (matchedSector) {
    focusLines.push(`Se ragiono come consulente Zenit, il primo contesto che vedo e ${matchedSector.label}.`);
  }

  if (needProfile.matchedRisks.length) {
    focusLines.push(`Il rischio dominante che leggo nella richiesta e ${needProfile.matchedRisks.join(", ")}.`);
  }

  if (matchedMicrocategory) {
    focusLines.push(`Come punto di partenza ti orienterei su ${matchedMicrocategory.microcategory}, dentro ${matchedMicrocategory.category.label}.`);
  } else if (matchedKnowledgeCategory) {
    focusLines.push(`Come famiglia prodotto partirei da ${matchedKnowledgeCategory.label}.`);
  } else if (needProfile.suggestedCategories.length) {
    focusLines.push(`Le famiglie prodotto che vedo piu coerenti sono ${needProfile.suggestedCategories.join(", ")}.`);
  }

  const nextQuestion = matchedSector?.questions?.[0]
    || (needProfile.quantity === "team"
      ? "Ti serve una dotazione per una squadra intera o per pochi operatori?"
      : "Mi dici il contesto operativo preciso, cosi restringo meglio?");

  return `${focusLines.join(" ")} Per aiutarti bene non ti farei perdere tempo con tutto il catalogo: restringerei subito il campo e poi ti chiederei solo una cosa chiave. ${nextQuestion}`;
}

function getMeaningfulTokens(value) {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 2)
    .map((token) => {
      if (token.endsWith("i") || token.endsWith("e")) return token.slice(0, -1);
      return token;
    });
}

function getTokenOverlapScore(question, candidate) {
  const questionTokens = [...new Set(getMeaningfulTokens(question))];
  const candidateTokens = [...new Set(getMeaningfulTokens(candidate))];
  if (!questionTokens.length || !candidateTokens.length) return 0;

  let score = 0;
  candidateTokens.forEach((candidateToken) => {
    if (questionTokens.some((questionToken) => questionToken === candidateToken || questionToken.includes(candidateToken) || candidateToken.includes(questionToken))) {
      score += 1;
    }
  });

  return score;
}

function findBestKnowledgeCategory(question, knowledge) {
  const scoredCategories = Object.values(knowledge.categories)
    .map((category) => {
      const score = Math.max(
        getTokenOverlapScore(question, category.label),
        getTokenOverlapScore(question, category.focus),
        getTokenOverlapScore(question, category.catalogCategory || ""),
        ...category.microcategories.map((item) => getTokenOverlapScore(question, item))
      );

      return { category, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scoredCategories[0]?.category || null;
}

function findBestMicrocategory(question, knowledge) {
  const scoredMicrocategories = Object.values(knowledge.categories)
    .flatMap((category) =>
      Object.entries(category.microDetails || {}).map(([microcategory, description]) => ({
        category,
        microcategory,
        description,
        score: Math.max(
          getTokenOverlapScore(question, microcategory),
          getTokenOverlapScore(question, `${category.label} ${microcategory}`)
        )
      }))
    )
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scoredMicrocategories[0] || null;
}

function searchGoogle(queryText) {
  const term = String(queryText || "").trim();
  if (!term) return;
  const url = `https://www.google.com/search?q=${encodeURIComponent(`Zenit DPI ${term}`)}`;
  const popup = window.open(url, "_blank", "noopener,noreferrer");
  if (!popup) {
    window.location.href = url;
  }
}

function shouldTriggerAssistantWebResearch(question, response) {
  if (!isAssistantWebModeEnabled()) return false;
  const q = normalizeText(question);
  const intent = response?.meta?.lastIntent || "";
  if (/(greeting|identity|company|company-strengths|company-contact|contact|cart|showcase|catalog|products|brands|category|microcategory|sector|certification|certifications|consultative-advice|consultative-follow-up|fallback)/.test(intent)) {
    return false;
  }
  if (intent === "web-search") return true;
  return /(cerca sul web|cerca online|fai una ricerca|cerca su internet|approfondisci sul web|verifica online|trova online)/.test(q);
}

async function performAssistantWebResearch(question) {
  const payload = await apiFetch("/api/assistant/research", {
    method: "POST",
    body: JSON.stringify({ question })
  });
  return {
    text: payload.answer || "Ho completato la ricerca interna, ma non ho raccolto abbastanza elementi solidi.",
    sources: Array.isArray(payload.sources) ? payload.sources : []
  };
}

function getAssistantThinkingDelay(question, phase = "primary") {
  const q = normalizeText(question);
  const words = q.split(" ").filter(Boolean);
  let complexity = words.length * 120;

  if (/(confronta|differenza|approfondisci|spiegami|certificazioni|atex|spazi confinati|petrolchimico|preventivo|fornitura|brand|marchio|attrezz)/.test(q)) {
    complexity += 1200;
  }

  if (words.length >= 12) {
    complexity += 1200;
  }

  if (phase === "research") {
    complexity += 900;
  }

  return Math.max(1200, Math.min(phase === "research" ? 5200 : 3800, complexity));
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSiteKnowledge() {
  const categories = {
    anticaduta: {
      label: "DPI Anticaduta & Linee Vita",
      catalogCategory: "Anticaduta",
      focus: "lavori in quota, ancoraggio e protezione da caduta",
      microcategories: [
        "Imbracature base",
        "Imbracature professionali",
        "Kit completi",
        "Cordini",
        "Connettori",
        "Ancoraggi e linee vita"
      ],
      standards: ["EN 361", "EN 795"],
      references: ["OSHA PPE", "OSHA Personal Fall Arrest Systems"],
      microDetails: {
        "Imbracature base":
          "Sono il primo livello per lavorare in quota con ordine e sicurezza: distribuiscono le forze sul corpo, devono vestire bene e vanno scelte in base a punti di attacco, frequenza d'uso e semplicita di regolazione.",
        "Imbracature professionali":
          "Sono pensate per uso intensivo, lavori complessi e permanenze prolungate. In genere offrono regolazioni piu precise, maggiore ergonomia e configurazioni piu adatte anche a posizionamento e recupero.",
        "Kit completi":
          "Sono la scelta piu pratica quando vuoi partire con un sistema coerente: uniscono imbracatura, cordino e connettori compatibili, riducendo errori di abbinamento e velocizzando la dotazione della squadra.",
        Cordini:
          "Collegano l'operatore all'ancoraggio. La scelta giusta dipende da lunghezza, presenza dell'assorbitore, rischio di caduta libera e tirante d'aria realmente disponibile sotto l'operatore.",
        Connettori:
          "Moschettoni e ganci devono garantire chiusura sicura, compatibilita con il sistema e corretto accoppiamento con i punti di aggancio, evitando configurazioni improvvisate o geometrie incompatibili.",
        "Ancoraggi e linee vita":
          "Sono il cuore del sistema. OSHA ricorda che gli ancoraggi per il fall arrest devono essere indipendenti dal supporto della piattaforma e sostenere almeno 5.000 libbre per lavoratore collegato, oppure essere progettati e verificati da persona qualificata."
      }
    },
    antinfortunistica: {
      label: "Antinfortunistica",
      catalogCategory: "Antinfortunistica",
      focus: "protezione personale e operativa in ambienti industriali e di cantiere",
      microcategories: ["Testa", "Vista", "Udito", "Mani", "Vie respiratorie", "Monouso"],
      standards: ["DPI Marcati CE"],
      references: ["OSHA PPE", "OSHA Respiratory Protection"],
      microDetails: {
        Testa:
          "Qui rientrano elmetti e protezioni craniche per urti, caduta oggetti e rischi ambientali. La scelta corretta dipende da cantiere, impianto, quota, spazi ristretti e compatibilita con visiere, cuffie o sottogola.",
        Vista:
          "Occhiali, goggles e visiere servono contro impatti, polveri, schizzi chimici, metallo fuso e radiazioni del processo. OSHA richiama una scelta coerente col rischio e riferimenti ANSI Z87.1 per i dispositivi di protezione occhi e viso.",
        Udito:
          "Inserti e cuffie proteggono dal rumore continuo o impulsivo. OSHA segnala che gia oltre 85 dBA in media sulle 8 ore serve un programma di conservazione dell'udito: quindi la protezione va scelta per attenuare bene senza isolare troppo l'operatore.",
        Mani:
          "I guanti cambiano in base a taglio, abrasione, calore, agenti chimici e sensibilita richiesta. In pratica non esiste un guanto universale: va costruito sul rischio dominante e sul livello di precisione richiesto all'operatore.",
        "Vie respiratorie":
          "Quando il rischio non si controlla abbastanza con ventilazione o altre misure, serve un respiratore adatto. OSHA richiede selezione corretta, valutazione di idoneita e fit test prima dell'uso, a ogni cambio di facciale e almeno una volta l'anno per i facciali aderenti.",
        Monouso:
          "E utile per lavorazioni sporche, visite impianto, attivita brevi o gestione ospiti, quando servono barriera rapida, ordine operativo e ricambio frequente senza complicare troppo la logistica."
      }
    },
    calzature_abbigliamento: {
      label: "Calzature e Abbigliamento",
      catalogCategory: "Calzature e Abbigliamento",
      focus: "comfort, sicurezza quotidiana, alta visibilità e multiprotezione",
      microcategories: ["S1P", "S3", "Alte prestazioni", "Alta visibilita", "Tecnico da cantiere", "Multiprotezione"],
      standards: ["S1P", "S3"],
      references: ["Catalogo operativo Zenit"],
      microDetails: {
        S1P: "Calzature pensate per ambienti asciutti e uso quotidiano, con puntale e lamina antiperforazione. Sono spesso una buona scelta quando cerchi agilita, comfort e protezione meccanica di base.",
        S3: "Sono piu adatte a contesti severi, cantieri, impianti e ambienti esterni, dove oltre alla protezione del piede servono robustezza, tenuta e maggiore versatilita operativa.",
        "Alte prestazioni":
          "Queste linee puntano su comfort prolungato, leggerezza, supporto e resistenza. Le consiglio quando il personale sta molte ore in movimento e l'affaticamento diventa un tema reale.",
        "Alta visibilita":
          "Abbigliamento studiato per rendere l'operatore piu visibile in aree di traffico, cantiere, logistica o bassa illuminazione. Qui il tema non e solo estetico: e percezione immediata e riduzione del rischio.",
        "Tecnico da cantiere":
          "Capi robusti e funzionali per attivita quotidiane, con tasche operative, resistenza meccanica e vestibilita pensata per inginocchiarsi, salire, muoversi e lavorare davvero sul campo.",
        Multiprotezione:
          "Sono soluzioni per ambienti dove serve sommare piu livelli di protezione nello stesso capo. Hanno senso quando non basta il semplice abbigliamento tecnico e il rischio e combinato."
      }
    },
    atex: {
      label: "Prodotti ATEX",
      catalogCategory: "ATEX",
      focus: "ambienti a rischio esplosione, rilevazione, monitoraggio e accessori certificati",
      microcategories: ["Rilevatori gas", "Monitoraggio", "Accessori certificati", "Illuminazione ATEX", "Strumentazione", "Dispositivi portatili"],
      standards: ["Direttiva 2014/34/UE"],
      references: ["Direttiva ATEX 2014/34/UE"],
      microDetails: {
        "Rilevatori gas":
          "Servono a individuare tempestivamente atmosfere pericolose e aiutano a decidere se entrare, restare o evacuare. In pratica sono strumenti chiave quando vuoi trasformare il rischio invisibile in un dato leggibile.",
        Monitoraggio:
          "Permette controllo continuo dei parametri critici in aree con rischio esplosivo. E particolarmente utile in manutenzione, fermate impianto, verifiche periodiche e accessi controllati.",
        "Accessori certificati":
          "Componenti, custodie e accessori devono restare coerenti con la zona classificata e non introdurre nuove fonti di innesco. Spesso e proprio qui che si gioca la serieta dell'intero sistema.",
        "Illuminazione ATEX":
          "L'illuminazione ATEX consente visibilita operativa senza compromettere la sicurezza nelle zone classificate. La Direttiva 2014/34/UE disciplina apparecchi e sistemi destinati ad atmosfere potenzialmente esplosive per garantire un elevato livello di tutela di persone e impianti.",
        Strumentazione:
          "Comprende strumenti di misura e controllo pensati per lavorare in sicurezza in zone classificate, con requisiti coerenti al livello di rischio e alla continuita di utilizzo richiesta dall'impianto.",
        "Dispositivi portatili":
          "Torcie, rilevatori e strumenti palmari certificati aiutano gli operatori mobili a lavorare in ambienti Ex con piu continuita, piu autonomia e piu controllo durante ispezioni e manutenzioni."
      }
    },
    spazi_confinati: {
      label: "Spazi Confinati",
      catalogCategory: "Spazi Confinati",
      focus: "accesso, recupero, evacuazione, ventilazione e comunicazione in ambienti critici",
      microcategories: ["Treppiedi e davit", "Recuperatori", "Kit evacuazione", "Comunicazione", "Ventilazione", "Illuminazione"],
      standards: ["DPI Marcati CE"],
      references: ["HSE Confined Spaces", "HSE Welding in Confined Spaces"],
      microDetails: {
        "Treppiedi e davit":
          "Sono strutture di accesso e recupero pensate per ingressi verticali. Hanno valore vero quando il recupero deve essere previsto prima dell'ingresso e non improvvisato dopo.",
        Recuperatori:
          "Consentono il recupero assistito dell'operatore in emergenza e hanno senso solo se inseriti dentro una procedura di salvataggio gia pianificata, provata e assegnata a persone formate.",
        "Kit evacuazione":
          "Raccolgono gli elementi essenziali per uscita e recupero, riducendo i tempi morti nei momenti in cui ogni secondo pesa davvero.",
        Comunicazione:
          "In spazi confinati servono collegamenti chiari tra interno ed esterno per allarme, coordinamento e attivazione del soccorso. Senza comunicazione affidabile, anche una procedura buona perde efficacia.",
        Ventilazione:
          "HSE raccomanda ventilazione naturale o forzata adeguata per evitare accumulo di gas e atmosfere pericolose. Un punto importante: l'atmosfera non va mai corretta arricchendola con ossigeno.",
        Illuminazione:
          "L'illuminazione deve aiutare visibilita e ispezione senza introdurre rischi aggiuntivi, soprattutto in ambienti angusti, profondi o potenzialmente pericolosi."
      }
    },
    saldatura: {
      label: "Saldatura",
      catalogCategory: "Saldatura",
      focus: "protezione del saldatore, area di lavoro e accessori dedicati",
      microcategories: ["Maschere", "Guanti", "Abbigliamento", "Consumabili", "Accessori", "Protezione area lavoro"],
      standards: ["EN 175"],
      references: ["OSHA Welding", "HSE Welding"],
      microDetails: {
        Maschere:
          "Proteggono occhi e volto da radiazioni, scintille e proiezioni. La scelta cambia in base al processo, al comfort richiesto e a quante ore la maschera resta realmente indossata.",
        Guanti:
          "Devono proteggere da calore, abrasione e schizzi metallici mantenendo comunque presa e sensibilita sufficienti per lavorare con precisione.",
        Abbigliamento:
          "Serve a schermare il corpo da scintille, metallo caldo e calore radiante, mantenendo al tempo stesso mobilita, robustezza e continuita di utilizzo.",
        Consumabili:
          "Elettrodi, fili e accessori di consumo influenzano qualita del processo, continuita operativa e coerenza con il tipo di lavorazione e con i materiali trattati.",
        Accessori:
          "Comprendono ricambi, supporti e componenti che mantengono efficiente la postazione e riducono fermate non previste, soprattutto nelle linee dove la ripetibilita conta.",
        "Protezione area lavoro":
          "OSHA e HSE richiamano rischi come fumi metallici, ustioni, danni oculari e shock elettrico. Proteggere l'area di lavoro significa contenere esposizioni, scintille e interferenze verso gli altri operatori, e usare ventilazione locale o RPE quando i fumi non sono controllati abbastanza."
      }
    },
    sicurezza_ambientale: {
      label: "Sicurezza Ambientale",
      catalogCategory: null,
      focus: "antinquinamento e soluzioni ambientali per contesti industriali",
      microcategories: ["Soluzioni antinquinamento", "Gestione ambientale", "Supporto operativo"],
      standards: [],
      references: ["OSHA PPE"],
      microDetails: {
        "Soluzioni antinquinamento":
          "Qui rientrano assorbenti, contenimento perdite, barriere e materiali utili a reagire rapidamente a sversamenti e criticita ambientali. Il valore vero e limitare propagazione, fermo e impatto operativo.",
        "Gestione ambientale":
          "E l'area che aiuta a mantenere ordine, prevenzione e conformita nella gestione quotidiana di materiali, scarti, stoccaggi e situazioni sensibili. In pratica significa lavorare puliti prima ancora di dover rimediare.",
        "Supporto operativo":
          "Comprende tutto cio che rende piu rapida e controllata la risposta sul campo: kit pronti, soluzioni di presidio e strumenti che aiutano il personale a intervenire con metodo."
      }
    }
  };

  const certifications = {
    "en iso 9001 2015": "Sistema di gestione della qualità: organizzazione, continuità di processo e affidabilità del servizio.",
    "en iso 45001 2018": "Sistema di gestione per salute e sicurezza sul lavoro: attenzione strutturata ai contesti operativi e ai rischi.",
    "sa 8000 2014": "Standard di responsabilità sociale: impegno su etica, persone e correttezza organizzativa.",
    "dpi marcati ce": "Dispositivi conformi ai requisiti europei di sicurezza e marcatura CE."
  };

  const sectorPlaybooks = {
    chimico: {
      label: "Chimico",
      aliases: ["chimico", "chimica", "laboratorio industriale"],
      profile: "Contesti con esposizione a sostanze, rischio contaminazione, protezione mani, occhi, vie respiratorie e controllo operativo.",
      priorities: ["protezione mani", "protezione occhi e viso", "vie respiratorie", "monouso tecnico"],
      recommendedCategories: ["Antinfortunistica", "Calzature e Abbigliamento", "Sicurezza Ambientale"],
      questions: ["Quali agenti sono coinvolti?", "Serve barriera chimica o meccanica?", "Lavori in area controllata o in impianto aperto?"]
    },
    petrolchimico: {
      label: "Petrolchimico",
      aliases: ["petrolchimico", "raffineria", "oil gas", "impianto ex"],
      profile: "Ambienti ad alta complessita con rischio Ex, monitoraggio, accessi critici e forte attenzione alla continuita operativa.",
      priorities: ["prodotti ATEX", "rilevazione gas", "spazi confinati", "abbigliamento multiprotezione"],
      recommendedCategories: ["ATEX", "Spazi Confinati", "Calzature e Abbigliamento", "Antinfortunistica"],
      questions: ["L'area e classificata Ex?", "Ci sono accessi in spazi confinati?", "Serve monitoraggio continuo o portatile?"]
    },
    edile: {
      label: "Edile & Costruzioni",
      aliases: ["edile", "cantiere", "costruzioni", "ponteggio", "copertura"],
      profile: "Lavorazioni dinamiche con rischio caduta, urti, abrasione, visibilita e resistenza quotidiana dell'equipaggiamento.",
      priorities: ["anticaduta", "elmetti e visiere", "calzature S3", "alta visibilita"],
      recommendedCategories: ["Anticaduta", "Antinfortunistica", "Calzature e Abbigliamento"],
      questions: ["Lavorate in quota?", "Serve dotazione continuativa per squadra?", "Il cantiere richiede alta visibilita o multiprotezione?"]
    },
    energetico: {
      label: "Energetico",
      aliases: ["energetico", "energia", "utility", "centrale", "impianto energetico"],
      profile: "Scenari tecnici con manutenzione, impianti complessi, accessi controllati e attenzione a continuita e tempestivita della fornitura.",
      priorities: ["antinfortunistica tecnica", "ATEX se area classificata", "spazi confinati", "abbigliamento tecnico"],
      recommendedCategories: ["Antinfortunistica", "ATEX", "Spazi Confinati", "Calzature e Abbigliamento"],
      questions: ["Ci sono fermate impianto o manutenzioni programmate?", "Le squadre lavorano indoor o outdoor?", "Esistono aree critiche o classificate?"]
    },
    navale: {
      label: "Navale & Marittimo",
      aliases: ["navale", "marittimo", "cantiere navale", "porto", "bordo"],
      profile: "Operazioni in ambienti esposti, lavori in quota, saldatura, movimentazione e condizioni difficili su banchina o a bordo.",
      priorities: ["anticaduta", "saldatura", "calzature performanti", "abbigliamento tecnico resistente"],
      recommendedCategories: ["Anticaduta", "Saldatura", "Calzature e Abbigliamento", "Antinfortunistica"],
      questions: ["Si lavora a bordo, in cantiere o in officina?", "Ci sono attivita di saldatura o manutenzione pesante?", "Serve supporto per squadre mobili?"]
    },
    automotive: {
      label: "Automotive & Trasporti",
      aliases: ["automotive", "trasporti", "officina", "assemblaggio", "logistica industriale"],
      profile: "Processi rapidi dove contano ergonomia, continuita di fornitura, comfort e protezioni adatte a linee e officine.",
      priorities: ["guanti e protezione mani", "calzature leggere", "abbigliamento tecnico", "protezione vista e udito"],
      recommendedCategories: ["Antinfortunistica", "Calzature e Abbigliamento", "Saldatura"],
      questions: ["Parliamo di linea, officina o logistica?", "Conta di piu comfort, grip o resistenza?", "Sono presenti saldatura o lavorazioni meccaniche?"]
    },
    servizi: {
      label: "Servizi & Facility",
      aliases: ["servizi", "facility", "manutenzione", "global service", "service"],
      profile: "Attivita molto diverse tra loro, dove flessibilita, rapidita di approvvigionamento e chiarezza della dotazione fanno la differenza.",
      priorities: ["dotazioni versatili", "monouso", "calzature comode", "DPI base affidabili"],
      recommendedCategories: ["Antinfortunistica", "Calzature e Abbigliamento", "Sicurezza Ambientale"],
      questions: ["Gli operatori fanno manutenzione, pulizia tecnica o presidio impianti?", "Serve una dotazione standard o personalizzata per mansione?", "Quanto conta la rapidita di reintegro?"]
    }
  };

  return {
    company: {
      name: "Zenit Srl",
      profile: "Societa tarantina specializzata nella fornitura di Dispositivi di Protezione Individuale certificati CE.",
      positioning: "Partner commerciale e tecnico per aziende industriali, cantieri, navale, automotive, energia e altri contesti professionali.",
      experience: "Oltre 20 anni di esperienza sul campo.",
      location: "Via Tratturello Tarantino 5 - 74123 Taranto (TA)",
      vat: "P.IVA / Cod. Fiscale 02455090734",
      summary:
        "Zenit Srl e una realta di Taranto che aiuta aziende e cantieri a gestire la sicurezza sul lavoro con DPI, consulenza commerciale, continuita di fornitura e un approccio concreto ai contesti industriali reali.",
      valueProposition:
        "Zenit non si presenta come semplice rivenditore: il suo valore sta nel capire il bisogno, proporre prodotti coerenti e restare affidabile nel tempo.",
      coreStrengths: [
        "Oltre 20 anni di esperienza sul campo",
        "Risposta ai preventivi entro 24h",
        "Approccio B2B e consulenziale",
        "DPI certificati CE",
        "Supporto per forniture continuative"
      ],
      sectorsServed: [
        "Chimico & Petrolchimico",
        "Edile & Costruzioni",
        "Energetico",
        "Navale & Marittimo",
        "Automotive & Trasporti",
        "Servizi & Facility"
      ],
      productFamilies: [
        "DPI Anticaduta & Linee Vita",
        "Antinfortunistica",
        "Calzature e Abbigliamento",
        "Prodotti ATEX",
        "Spazi Confinati",
        "Saldatura",
        "Sicurezza Ambientale"
      ],
      approach: [
        "Ascolto del bisogno reale",
        "Selezione di prodotti coerenti con il contesto",
        "Continuita di fornitura e supporto commerciale"
      ],
      servicePromise: "Risposta preventivi entro 24h, approccio B2B e supporto consulenziale."
    },
    categories,
    categoryList: [...new Set(products.map((product) => product.category).filter(Boolean))],
    certifications,
    certificationsList: Object.keys(certifications),
    microcategories: Object.values(categories).flatMap((category) => category.microcategories),
    contacts: [
      "099.4725984",
      "099.4723444",
      "commerciale@zenitsrl.it",
      "amministrazione@zenitsrl.it",
      "Via Tratturello Tarantino 5 - Taranto (TA)"
    ],
    sectors: ["chimico", "petrolchimico", "edile", "energetico", "navale", "automotive", "servizi"],
    sectorsLabels: [
      "Chimico & Petrolchimico",
      "Edile & Costruzioni",
      "Energetico",
      "Navale & Marittimo",
      "Automotive & Trasporti",
      "Servizi & Facility"
    ],
    sectorPlaybooks,
    brandKnowledge: brands.map((brand) => ({
      name: brand.name,
      label: brand.label,
      website: brand.website,
      email: brand.email,
      notes: brand.notes,
      knowledgeUpdatedAt: brand.knowledgeUpdatedAt
    }))
  };
}

function findMatchingProducts(question) {
  const q = normalizeText(question);
  return products.filter((product) => {
    const haystack = normalizeText(
      `${product.name} ${product.category} ${product.brand} ${product.subtitle} ${product.description} ${product.tags.join(" ")}`
    );
    return haystack.includes(q) || q.split(" ").some((term) => term.length > 2 && haystack.includes(term));
  });
}

function findMatchingBrands(question) {
  const q = normalizeText(question);
  return brands.filter((brand) => {
    const haystack = normalizeText(`${brand.name} ${brand.label} ${brand.website} ${brand.email} ${brand.notes}`);
    return haystack.includes(q) || q.split(" ").some((term) => term.length > 2 && haystack.includes(term));
  });
}

function answerAssistantQuestion(question) {
  const q = normalizeText(question);
  const knowledge = getSiteKnowledge();
  const needProfile = buildNeedProfile(question, knowledge);
  const matchingProducts = findMatchingProducts(q);
  const matchingBrands = findMatchingBrands(q);
  const matchedSectorEntry = Object.entries(knowledge.sectorPlaybooks).find(([, sector]) =>
    sector.aliases.some((alias) => q.includes(normalizeText(alias)))
  );
  const matchedSector = matchedSectorEntry?.[1] || null;
  const exactMatchedMicrocategory = Object.values(knowledge.categories).flatMap((category) =>
    Object.entries(category.microDetails || {}).map(([microcategory, description]) => ({
      category,
      microcategory,
      description
    }))
  ).find((entry) => q.includes(normalizeText(entry.microcategory)));
  const matchedMicrocategory = exactMatchedMicrocategory || findBestMicrocategory(question, knowledge);
  const matchedCategory = knowledge.categoryList.find((category) => q.includes(normalizeText(category)));
  const exactMatchedKnowledgeCategory = Object.values(knowledge.categories).find((category) => {
    const label = normalizeText(category.label);
    const focus = normalizeText(category.focus);
    const categoryName = normalizeText(category.catalogCategory);
    const microHit = category.microcategories.some((item) => q.includes(normalizeText(item)));
    return q.includes(label) || (categoryName && q.includes(categoryName)) || q.includes(focus) || microHit;
  });
  const matchedKnowledgeCategory = exactMatchedKnowledgeCategory || findBestKnowledgeCategory(question, knowledge);
  const matchedCertification = Object.entries(knowledge.certifications).find(([key]) => q.includes(key));
  const isFollowUpQuestion =
    q.split(" ").length <= 7 ||
    /(e per|e invece|approfondisci|spiegami meglio|piu nel dettaglio|continua|quali prodotti|quale categoria|da dove parto|cosa mi consigli)/.test(q);
  const wantsExplicitWebResearch =
    /(cerca sul web|cerca online|fai una ricerca|cerca su internet|approfondisci sul web|verifica online|trova online)/.test(q);
  const buildReferenceLine = (references = []) =>
    references?.length ? ` Mi sto basando su riferimenti come ${references.join(", ")}.` : "";

  if (!q) {
    return {
      text: "Scrivimi pure cosa ti serve. Sono l'intelligenza artificiale settoriale di Zenit e posso ragionare per settore, categoria, microcategoria, certificazione, brand, preventivi e prodotti presenti nel sito.",
      action: null,
      meta: { lastIntent: "help", lastQuestion: question }
    };
  }

  if (/(ciao|salve|buongiorno|buonasera|hey)/.test(q)) {
    return {
      text: "Ciao, sono Carlo 2.0. Possiamo parlare come in una chat: dimmi il tuo settore, un rischio, una categoria prodotto o un'esigenza pratica e continuo il ragionamento insieme a te.",
      action: null,
      meta: { lastIntent: "greeting", lastQuestion: question }
    };
  }

  if (/(sei chatgpt|sei un ai|sei una ia|sei intelligenza artificiale|chi sei)/.test(q)) {
    return {
      text: "Sono Carlo 2.0, l'assistente AI di Zenit. Non sono ChatGPT collegato a un modello esterno, ma nel sito posso comportarmi come un consulente conversazionale: ricordo il contesto, seguo i tuoi follow-up e ti aiuto a ragionare per settore, rischio, categoria e prodotto.",
      action: null,
      meta: { lastIntent: "identity", lastQuestion: question }
    };
  }

  if (/(confronta|differenza|differenze|meglio|meglio tra|vs|oppure)/.test(q)) {
    const comparisonTargets = [matchedMicrocategory?.microcategory, matchedKnowledgeCategory?.label, matchedCategory]
      .filter(Boolean);

    if (comparisonTargets.length >= 1 || assistantConversationState.lastCategory || assistantConversationState.lastMicrocategory) {
      const rememberedCategory = assistantConversationState.lastCategory
        ? Object.values(knowledge.categories).find((category) => category.catalogCategory === assistantConversationState.lastCategory)
        : null;
      const rememberedMicro = assistantConversationState.lastMicrocategory;

      return {
        text: `Posso aiutarti anche a ragionare per confronto, non solo per definizioni. ${
          rememberedMicro
            ? `Fin qui l'ultimo punto chiave era ${rememberedMicro}. `
            : rememberedCategory
              ? `Fin qui stavamo ragionando su ${rememberedCategory.label}. `
              : ""
        }Se vuoi fare un confronto utile, scrivimi le due opzioni nello stesso messaggio, per esempio "S1P o S3", "ATEX o spazi confinati", "imbracatura base o professionale", e ti rispondo con differenza pratica, contesto ideale e trade-off reale.`,
        action: null,
        meta: {
          lastIntent: "comparison",
          lastQuestion: question,
          lastNeedProfile: needProfile
        }
      };
    }
  }

  if (isFollowUpQuestion && assistantConversationState.lastSector) {
    const rememberedSector = knowledge.sectorPlaybooks[assistantConversationState.lastSector];
    if (rememberedSector && /(quali prodotti|quale categoria|quali categorie|da dove parto|cosa mi consigli|approfondisci|continua|e quindi)/.test(q)) {
      return {
        text: `Ripartendo dal settore ${rememberedSector.label}, ti consiglierei di iniziare da ${rememberedSector.recommendedCategories.join(", ")}. Le priorita operative che terrei in testa sono ${rememberedSector.priorities.join(", ")}. Se vuoi, nel messaggio successivo posso restringere ancora per rischio specifico, per esempio quota, area Ex, saldatura, vie respiratorie o comfort operativo.`,
        action: () => handleAssistantAction("catalog"),
        meta: {
          lastIntent: "sector-follow-up",
          lastSector: assistantConversationState.lastSector,
          lastSuggestedCategories: rememberedSector.recommendedCategories,
          lastNeedProfile: needProfile,
          lastQuestion: question
        }
      };
    }
  }

  if (isFollowUpQuestion && assistantConversationState.lastCategory) {
    const rememberedCategory = Object.values(knowledge.categories).find(
      (category) => category.catalogCategory === assistantConversationState.lastCategory
    );
    if (rememberedCategory && /(approfondisci|spiegami meglio|quali microcategorie|continua|e quindi)/.test(q)) {
      return {
        text: `Certo. Su ${rememberedCategory.label} Zenit si muove cosi: focus su ${rememberedCategory.focus}, microcategorie chiave ${rememberedCategory.microcategories.join(", ")}. Se vuoi, posso anche consigliarti quale microcategoria guardare prima in base al tuo settore o al rischio che devi coprire.`,
        action: rememberedCategory.catalogCategory ? () => handleAssistantAction("catalog") : null,
        meta: {
          lastIntent: "category-follow-up",
          lastCategory: assistantConversationState.lastCategory,
          lastNeedProfile: needProfile,
          lastQuestion: question
        }
      };
    }
  }

  if (isFollowUpQuestion && assistantConversationState.lastNeedProfile?.matchedRisks?.length) {
    const rememberedRiskReply = buildConsultativeReply({
      knowledge,
      needProfile: {
        ...assistantConversationState.lastNeedProfile,
        ...needProfile,
        matchedRisks: assistantConversationState.lastNeedProfile.matchedRisks
      },
      matchedSector,
      matchedKnowledgeCategory,
      matchedMicrocategory
    });
    if (/(continua|approfondisci|e quindi|allora|quindi|cosa faresti|come procederesti)/.test(q)) {
      return {
        text: `${rememberedRiskReply} Se vuoi, il passo dopo e dirti quali microcategorie o quali prodotti guarderei per primi.`,
        action: null,
        meta: {
          lastIntent: "consultative-follow-up",
          lastNeedProfile: assistantConversationState.lastNeedProfile,
          lastQuestion: question
        }
      };
    }
  }

  if (/(chi e zenit|chi siete|parlami di zenit|cosa fate|presentami zenit|dimmi chi e zenit|raccontami zenit|cosa fa zenit|cos e zenit)/.test(q)) {
    return {
      text: `${knowledge.company.summary} ${knowledge.company.experience} Lavora soprattutto con ${knowledge.company.sectorsServed.join(", ")}. Le aree principali che presidia sono ${knowledge.company.productFamilies.slice(0, 6).join(", ")}. Il tratto distintivo di Zenit e questo: ${knowledge.company.valueProposition} Se vuoi, posso anche presentartela in modo piu commerciale, piu istituzionale oppure piu tecnico.`,
      action: null,
      meta: { lastIntent: "company", lastQuestion: question, lastNeedProfile: needProfile }
    };
  }

  if (/(perche scegliere zenit|perche zenit|punti di forza zenit|vantaggi zenit|cosa vi distingue)/.test(q)) {
    return {
      text: `Se dovessi riassumere Zenit in modo chiaro, direi questo: ${knowledge.company.valueProposition} I punti di forza che emergono dal sito sono ${knowledge.company.coreStrengths.join(", ")}. In altre parole, Zenit piace quando il cliente non vuole solo comprare un prodotto, ma trovare un partner affidabile che capisce il contesto e risponde con continuita.`,
      action: null,
      meta: { lastIntent: "company-strengths", lastQuestion: question, lastNeedProfile: needProfile }
    };
  }

  if (/(dove si trova zenit|dove siete|sede zenit|indirizzo zenit|contatti zenit)/.test(q)) {
    return {
      text: `${knowledge.company.name} ha sede in ${knowledge.company.location}. I riferimenti principali sono ${knowledge.contacts[0]}, ${knowledge.contacts[1]}, ${knowledge.contacts[2]} e ${knowledge.contacts[3]}. ${knowledge.company.vat}.`,
      action: null,
      meta: { lastIntent: "company-contact", lastQuestion: question, lastNeedProfile: needProfile }
    };
  }

  if (/(esperienza|anni di esperienza|da quanto tempo|fondazione|storia)/.test(q)) {
    return {
      text: `Sul sito Zenit viene presentata come partner per la sicurezza da oltre 20 anni, con presenza costruita su continuita, supporto commerciale e conoscenza delle esigenze industriali reali.`,
      action: null,
      meta: { lastIntent: "experience", lastQuestion: question }
    };
  }

  if (/(preventivo|offerta|quotazione|costo fornitura|richiesta)/.test(q)) {
    return {
      text: `Per richiedere un preventivo in modo efficace conviene indicare settore, quantitativi, urgenza, categoria prodotto e contesto operativo.${needProfile.quantity === "team" ? " Dalla tua richiesta sembra esserci una fornitura per piu operatori, quindi e utile specificare anche numero persone e continuita della fornitura." : ""}`,
      action: null,
      meta: { lastIntent: "quote", lastQuestion: question, lastNeedProfile: needProfile }
    };
  }

  if (/(contatti|telefono|email|mail|indirizzo|dove siete)/.test(q)) {
    return {
      text: `Puoi contattare Zenit via commerciale@zenitsrl.it oppure ai numeri ${knowledge.contacts[0]} e ${knowledge.contacts[1]}. Se vuoi, posso anche dirti come formulare una richiesta commerciale o tecnica in modo piu efficace.`,
      action: null,
      meta: { lastIntent: "contact", lastQuestion: question }
    };
  }

  if (/(carrello|ordine|acquisto)/.test(q)) {
    return {
      text: "Posso aiutarti a capire cosa inserire nel carrello, come comporre una richiesta ordine o quali prodotti confrontare prima dell'acquisto.",
      action: null,
      meta: { lastIntent: "cart", lastQuestion: question }
    };
  }

  if (/(catalogo|tutti i prodotti|prodotti completi|assortimento)/.test(q)) {
    return {
      text: "Il catalogo completo Zenit raccoglie l'intero assortimento. Se vuoi, posso aiutarti a restringerlo per categoria, microcategoria, rischio, settore o brand senza farti navigare a tentoni.",
      action: null,
      meta: { lastIntent: "catalog", lastQuestion: question }
    };
  }

  if (/(home|vetrina|in evidenza|prodotti evidenza)/.test(q)) {
    return {
      text: "La vetrina homepage mostra solo i prodotti messi in evidenza. Se vuoi, posso spiegarti quali famiglie prodotto hanno piu senso da mettere in risalto in base al tipo di cliente.",
      action: null,
      meta: { lastIntent: "showcase", lastQuestion: question }
    };
  }

  if (matchedCertification) {
    return {
      text: `${matchedCertification[0].toUpperCase().replaceAll("  ", " ")}: ${matchedCertification[1]}`,
      action: null,
      meta: { lastIntent: "certification", lastQuestion: question }
    };
  }

  if (/(certificazioni|iso|sa 8000|dpi certificati|ce)/.test(q)) {
    return {
      text: `Zenit mette in evidenza queste certificazioni e riferimenti: ${knowledge.certificationsList
        .map((item) => item.toUpperCase().replaceAll("  ", " "))
        .join(", ")}. Inoltre opera con DPI certificati CE.`,
      action: null,
      meta: { lastIntent: "certifications", lastQuestion: question }
    };
  }

  if (/(settori|navale|edile|automotive|chimico|energetico|servizi|petrolchimico)/.test(q)) {
    if (matchedSector) {
      return {
        text: `${matchedSector.label}: ${matchedSector.profile} In questo settore Carlo 2.0 tende a partire da ${matchedSector.priorities.join(", ")}. Le famiglie prodotto piu coerenti sono ${matchedSector.recommendedCategories.join(", ")}. Per orientarti meglio ti chiederei: ${matchedSector.questions.join(" ")}`,
        action: null,
        meta: {
          lastIntent: "sector",
          lastSector: matchedSectorEntry[0],
          lastSuggestedCategories: matchedSector.recommendedCategories,
          lastNeedProfile: needProfile,
          lastQuestion: question
        }
      };
    }

    return {
      text: `Zenit lavora su piu contesti: ${knowledge.sectorsLabels.join(", ")}. Ora Carlo 2.0 e configurato come AI settoriale: se mi scrivi il tuo settore, posso consigliarti priorita operative, categorie piu coerenti e domande giuste da fare prima del preventivo.`,
      action: null,
      meta: { lastIntent: "sectors", lastQuestion: question }
    };
  }

  if (/(categorie|macro categorie|microcategorie|micro categorie|famiglie prodotto|cosa trattate)/.test(q)) {
    const categorySummary = Object.values(knowledge.categories)
      .map((category) => `${category.label}: ${category.microcategories.slice(0, 4).join(", ")}`)
      .join(" | ");
    return {
      text: `Zenit copre queste aree principali: ${categorySummary}. Se vuoi posso approfondire una singola categoria o microcategoria.`,
      action: null,
      meta: { lastIntent: "categories", lastQuestion: question }
    };
  }

  if (needProfile.goal === "advisory" || needProfile.matchedRisks.length) {
    return {
      text: buildConsultativeReply({
        knowledge,
        needProfile,
        matchedSector,
        matchedKnowledgeCategory,
        matchedMicrocategory
      }),
      action: null,
      meta: {
        lastIntent: "consultative-advice",
        lastSector: needProfile.detectedSectorKey,
        lastCategory: matchedKnowledgeCategory?.catalogCategory || null,
        lastMicrocategory: matchedMicrocategory?.microcategory || null,
        lastSuggestedCategories: needProfile.suggestedCategories,
        lastNeedProfile: needProfile,
        lastQuestion: question
      }
    };
  }

  if (matchedMicrocategory) {
    const references = buildReferenceLine(matchedMicrocategory.category.references);
    return {
      text: `Se stiamo parlando di ${matchedMicrocategory.microcategory}, io la leggerei cosi: ${matchedMicrocategory.description} Fa parte dell'area ${matchedMicrocategory.category.label}. Se vuoi, nel passo successivo posso anche dirti quando conviene sceglierla, con cosa abbinarla e in quale settore la vedo piu spesso.${references}`,
      action: null,
      meta: {
        lastIntent: "microcategory",
        lastCategory: matchedMicrocategory.category.catalogCategory,
        lastMicrocategory: matchedMicrocategory.microcategory,
        lastNeedProfile: needProfile,
        lastQuestion: question
      }
    };
  }

  if (matchedSector) {
      return {
        text: `Per il settore ${matchedSector.label}, Zenit lavora con un approccio consulenziale: ${matchedSector.profile} Di solito le priorita sono ${matchedSector.priorities.join(", ")} e le famiglie prodotto piu adatte sono ${matchedSector.recommendedCategories.join(", ")}. Se vuoi, posso anche dirti con quale categoria partire prima.`,
      action: null,
      meta: {
        lastIntent: "sector",
        lastSector: matchedSectorEntry[0],
        lastSuggestedCategories: matchedSector.recommendedCategories,
        lastNeedProfile: needProfile,
        lastQuestion: question
      }
    };
  }

  if (matchedKnowledgeCategory) {
    const standards = matchedKnowledgeCategory.standards.length
      ? ` Riferimenti utili: ${matchedKnowledgeCategory.standards.join(", ")}.`
      : "";
    const references = buildReferenceLine(matchedKnowledgeCategory.references);
    return {
      text: `Su ${matchedKnowledgeCategory.label} ti orienterei cosi: e l'area Zenit dedicata a ${matchedKnowledgeCategory.focus}. Dentro trovi microcategorie come ${matchedKnowledgeCategory.microcategories.join(", ")}.${standards}${references} Se mi dici il rischio o il settore, posso restringere subito il campo invece di lasciarti davanti a un elenco generico.`,
      action: null,
      meta: {
        lastIntent: "category",
        lastCategory: matchedKnowledgeCategory.catalogCategory,
        lastNeedProfile: needProfile,
        lastQuestion: question
      }
    };
  }

  if (matchedCategory) {
    return {
      text: `Ho trovato la categoria ${matchedCategory}. ${
        currentPage === "catalog"
          ? "Posso filtrarti subito il catalogo su questa categoria."
          : "Ti posso portare nel catalogo completo gia orientato su questa categoria."
      }`,
      action: null,
      meta: {
        lastIntent: "category",
        lastCategory: matchedCategory,
        lastNeedProfile: needProfile,
        lastQuestion: question
      }
    };
  }

  if (matchingProducts.length) {
    const topProducts = matchingProducts
      .slice(0, 3)
      .map((product) => `${product.name}${product.brand ? ` (${product.brand})` : ""}`)
      .join(", ");
    return {
      text: `Ho trovato questi prodotti pertinenti nel sito: ${topProducts}. ${
        currentPage === "catalog"
          ? "Se vuoi, posso aiutarti a capire quale di questi guardare per primo."
          : "Se vuoi, posso aiutarti a capire quale di questi guardare per primo."
      }`,
      action: null,
      meta: { lastIntent: "products", lastQuestion: question, lastNeedProfile: needProfile }
    };
  }

  if (/(fornitura|forniture|mi servono|cerco|vorrei|ho bisogno di)/.test(q) && (matchedKnowledgeCategory || matchedMicrocategory)) {
    const targetCategory = matchedKnowledgeCategory || matchedMicrocategory?.category || null;
    const targetMicro = matchedMicrocategory?.microcategory || null;
    return {
      text: `Ho capito la richiesta in modo piu concreto: stai cercando una fornitura ${targetMicro ? `legata a ${targetMicro}` : `nell'area ${targetCategory?.label}`}. ${
        targetMicro
          ? `Se vuoi, posso guidarti partendo proprio da ${targetMicro}, spiegandoti differenze, contesto d'uso e prodotti da guardare per primi.`
          : `Se vuoi, posso restringere subito il catalogo sulla famiglia prodotto piu coerente e poi capire se ti serve una fornitura singola o per squadra.`
      }`,
      action: null,
      meta: {
        lastIntent: "supply-request",
        lastCategory: targetCategory?.catalogCategory || null,
        lastMicrocategory: targetMicro,
        lastNeedProfile: needProfile,
        lastQuestion: question
      }
    };
  }

  if (matchingBrands.length) {
    const featuredBrand = matchingBrands[0];
    if (featuredBrand && (q.includes(normalizeText(featuredBrand.name)) || /(brand|marchio|marca)/.test(q))) {
      const notes = featuredBrand.notes
        ? ` Quello che Carlo 2.0 ha assimilato su questo brand: ${featuredBrand.notes}`
        : " Per questo brand Carlo 2.0 non ha ancora trovato abbastanza segnali automatici dal dominio o dal sito collegato.";
      const website = featuredBrand.website ? ` Sito ufficiale: ${featuredBrand.website}.` : "";
      const email = featuredBrand.email ? ` Email collegata: ${featuredBrand.email}.` : "";
      return {
        text: `${featuredBrand.name}: ${featuredBrand.label || "brand partner presente nel sito."}${notes}${website}${email}`,
        action: null,
        meta: {
          lastIntent: "brand",
          lastBrand: featuredBrand.name,
          lastNeedProfile: needProfile,
          lastQuestion: question
        }
      };
    }

    const topBrands = matchingBrands.slice(0, 3).map((brand) => brand.name).join(", ");
    return {
      text: `Ho trovato questi brand collegati alla tua richiesta: ${topBrands}. Se vuoi, posso accompagnarti nel catalogo per cercare i prodotti associati o aiutarti a capire quale brand e piu coerente col contesto operativo.`,
      action: null,
      meta: { lastIntent: "brands", lastQuestion: question, lastNeedProfile: needProfile }
    };
  }

  if (wantsExplicitWebResearch && isAssistantWebModeEnabled()) {
    return {
      text: "Non trovo abbastanza elementi nella base interna di Zenit. Avvio una ricerca web integrata e ti rispondo qui dentro, senza farti uscire dal sito.",
      action: null,
      meta: { lastIntent: "web-search", lastQuestion: question, webResearchQuery: question }
    };
  }

  return {
    text: "Su questa richiesta non ho ancora un aggancio abbastanza chiaro. Scrivimi in modo piu diretto una di queste cose: settore, categoria, microcategoria, brand, certificazione oppure prodotto che stai cercando.",
    action: null,
    meta: { lastIntent: "fallback", lastQuestion: question, lastNeedProfile: needProfile }
  };
}

function handleAssistantAction(action) {
  if (!action) return;

  const handlers = {
    catalog() {
      appendAssistantMessage("user", "Vorrei vedere il catalogo completo.");
      appendAssistantMessage(
        "bot",
        "Posso aiutarti a leggere il catalogo in modo piu intelligente: dimmi categoria, rischio, settore o brand e restringiamo subito il campo."
      );
    },
    quote() {
      appendAssistantMessage("user", "Ho bisogno di un preventivo.");
      appendAssistantMessage(
        "bot",
        "Perfetto. Per un preventivo utile servono almeno settore, quantitativi, urgenza e categoria prodotto. Se vuoi, posso aiutarti a impostare una richiesta completa."
      );
    },
    showcase() {
      appendAssistantMessage("user", "Mostrami la vetrina della home.");
      appendAssistantMessage(
        "bot",
        "La vetrina della home serve a mettere in evidenza i prodotti strategici. Se vuoi, posso suggerirti quali famiglie hanno piu impatto da mettere in primo piano."
      );
    },
    contact() {
      appendAssistantMessage("user", "Mi servono i contatti.");
      appendAssistantMessage(
        "bot",
        "Puoi scrivere a commerciale@zenitsrl.it oppure chiamare 099.4725984 e 099.4723444. Se vuoi, posso anche aiutarti a scrivere il messaggio."
      );
    },
    cart() {
      appendAssistantMessage("user", "Apri il carrello.");
      appendAssistantMessage("bot", "Posso aiutarti a decidere cosa mettere nel carrello o come costruire una richiesta ordine piu precisa.");
    },
    sector() {
      appendAssistantMessage("user", "Voglio un consiglio per il mio settore.");
      appendAssistantMessage(
        "bot",
        "Perfetto. Dimmi in quale settore lavori tra chimico, petrolchimico, edile, energetico, navale, automotive o servizi e ti rispondo come AI settoriale Zenit."
      );
    }
  };

  handlers[action]?.();
}

categoryFilters?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  renderFilters();
  renderProducts();
});

searchInput?.addEventListener("input", (event) => {
  query = event.target.value.trim();
  renderProducts();
});

productGrid?.addEventListener("click", (event) => {
  const infoButton = event.target.closest("[data-product-info]");
  if (infoButton) {
    openProductInfoModal(infoButton.dataset.productInfo);
    return;
  }

  const button = event.target.closest(".add-to-cart");
  if (!button) return;
  addToCart(button.dataset.id);
});

cartItems?.addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-quantity-change]");
  if (quantityButton) {
    updateCartQuantity(quantityButton.dataset.quantityChange, Number(quantityButton.dataset.delta || 0));
    return;
  }

  const button = event.target.closest("[data-remove]");
  if (!button) return;
  removeFromCart(button.dataset.remove);
});

cartItems?.addEventListener("change", (event) => {
  const input = event.target.closest("[data-quantity-input]");
  if (!input) return;
  setCartQuantity(input.dataset.quantityInput, input.value);
});

adminForm?.addEventListener("submit", (event) => {
  if (!backendReady) {
    event.preventDefault();
    notifyBackendUnavailable();
    return;
  }
  if (!isAdminAuthenticated()) {
    event.preventDefault();
    window.alert("Effettua prima il login admin per aggiungere prodotti.");
    return;
  }
  handleAdminSubmit(event).catch(() => {
    alert("Non sono riuscito a salvare il prodotto. Controlla i campi e riprova.");
  });
});

adminCategorySelect?.addEventListener("change", () => {
  populateSubcategoryOptions(adminCategorySelect.value);
});

brandForm?.addEventListener("submit", (event) => {
  if (!backendReady) {
    event.preventDefault();
    notifyBackendUnavailable();
    return;
  }
  if (!isAdminAuthenticated()) {
    event.preventDefault();
    window.alert("Effettua prima il login admin per aggiungere brand.");
    return;
  }
  handleBrandSubmit(event).catch(() => {
    alert("Non sono riuscito a salvare il brand. Controlla i campi e riprova.");
  });
});

adminProductList?.addEventListener("click", (event) => {
  if (!isAdminAuthenticated()) return;

  const editButton = event.target.closest("[data-edit-product]");
  if (editButton) {
    startProductEdit(editButton.dataset.editProduct);
    return;
  }

  const toggleButton = event.target.closest("[data-toggle-showcase]");
  if (toggleButton) {
    handleToggleShowcase(toggleButton.dataset.toggleShowcase);
    return;
  }

  const deleteButton = event.target.closest("[data-delete]");
  if (!deleteButton) return;
  handleDeleteProduct(deleteButton.dataset.delete);
});

adminProductCancelEditButton?.addEventListener("click", () => {
  adminForm?.reset();
  resetProductFormState();
});

adminBrandList?.addEventListener("click", (event) => {
  if (!isAdminAuthenticated()) return;
  const editButton = event.target.closest("[data-edit-brand]");
  if (editButton) {
    startBrandEdit(editButton.dataset.editBrand);
    return;
  }
  const deleteButton = event.target.closest("[data-delete-brand]");
  if (!deleteButton) return;
  handleDeleteBrand(deleteButton.dataset.deleteBrand);
});

brandCancelEditButton?.addEventListener("click", () => {
  brandForm?.reset();
  resetBrandFormState();
  syncBrandKnowledgePreview();
});

adminOrdersList?.addEventListener("change", (event) => {
  if (!isAdminAuthenticated()) return;
  const select = event.target.closest("[data-order-status]");
  if (!select) return;
  updateOrderStatus(select.dataset.orderStatus, select.value);
});

async function handleAdminLoginSubmit(event, formElement) {
  event.preventDefault();
  const formData = new FormData(formElement);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  try {
    await apiFetch("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    await bootstrapApp();
    setAdminLoginFeedback("Accesso eseguito. L'area admin e ora sbloccata.");
    adminLoginForm?.reset();
    const redirectTarget = formElement?.dataset.redirect;
    if (redirectTarget) {
      window.location.href = redirectTarget;
      return;
    }
    document.querySelector("#admin")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    setAdminLoginFeedback(error.message || "Credenziali non valide. Usa username Zenit e password Qwerty78.", true);
  }
}

adminLoginForm?.addEventListener("submit", (event) => {
  if (!backendReady) {
    event.preventDefault();
    notifyBackendUnavailable("admin-login");
    return;
  }
  handleAdminLoginSubmit(event, adminLoginForm).catch((error) => {
    setAdminLoginFeedback(error.message || "Accesso admin non riuscito.", true);
  });
});

userLoginForm?.addEventListener("submit", (event) => {
  if (!backendReady) {
    event.preventDefault();
    notifyBackendUnavailable("user-login");
    return;
  }
  handleUserLoginSubmit(event, userLoginForm).catch((error) => {
    setUserAuthFeedback(userLoginMessage, error.message || "Accesso non riuscito.", true);
  });
});

userRegisterForm?.addEventListener("submit", (event) => {
  if (!backendReady) {
    event.preventDefault();
    notifyBackendUnavailable("user-register");
    return;
  }
  handleUserRegisterSubmit(event, userRegisterForm).catch((error) => {
    setUserAuthFeedback(userRegisterMessage, error.message || "Registrazione non riuscita.", true);
  });
});

adminLogoutButton?.addEventListener("click", async () => {
  try {
    await apiFetch("/api/admin/logout", {
      method: "POST",
      body: JSON.stringify({})
    });
  } catch {
    // no-op: even if logout request fails we still refresh local view below
  }
  await bootstrapApp().catch(() => {
    setAdminAuthenticated(false);
    syncAdminView();
  });
  setAdminLoginFeedback("Sessione admin chiusa. Inserisci di nuovo le credenziali per modificare il catalogo.");
});

cartButton?.addEventListener("click", () => toggleCart(true));
closeCart?.addEventListener("click", () => toggleCart(false));
backdrop?.addEventListener("click", () => toggleCart(false));
cartCheckoutButton?.addEventListener("click", () => {
  startCartCheckout();
});
openCartLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    toggleCart(true);
  });
});

assistantToggle?.addEventListener("click", () => {
  setAssistantOpen(assistantPanel?.hidden ?? true);
});

assistantClose?.addEventListener("click", () => {
  setAssistantOpen(false);
});

assistantInput?.addEventListener("focus", () => {
  if (assistantPanel?.hidden) return;
  syncAssistantViewportMetrics();
  window.setTimeout(() => {
    assistantInput?.scrollIntoView({ block: "nearest" });
    assistantMessages?.scrollTo({ top: assistantMessages.scrollHeight, behavior: "smooth" });
  }, 220);
});

assistantSuggestions?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-assistant-action]");
  if (!button) return;
  handleAssistantAction(button.dataset.assistantAction);
});

assistantWebModeToggle?.addEventListener("change", (event) => {
  event.target.checked = true;
  setAssistantWebModeEnabled(true);
});

assistantForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = assistantInput?.value.trim() || "";
  if (!question) return;

  appendAssistantMessage("user", question);
  assistantInput.value = "";
  assistantInput.blur();

  const thinkingMessage = appendThinkingMessage();
  await wait(getAssistantThinkingDelay(question, "primary"));
  thinkingMessage?.remove();

  const response = answerAssistantQuestion(question);
  appendAssistantMessage("bot", response.text);
  updateAssistantConversationState({
    lastQuestion: question,
    ...(response.meta || {})
  });

  const shouldRunIntegratedResearch =
    Boolean(response?.meta?.webResearchQuery) || shouldTriggerAssistantWebResearch(question, response);

  if (shouldRunIntegratedResearch) {
    const researchThinkingMessage = appendThinkingMessage();
    await wait(getAssistantThinkingDelay(question, "research"));
    try {
      const research = await performAssistantWebResearch(response?.meta?.webResearchQuery || question);
      researchThinkingMessage?.remove();
      appendAssistantMessage("bot", research.text, { sources: research.sources, extraClassName: "assistant-message--research" });
      updateAssistantConversationState({
        lastIntent: "web-research-result",
        lastQuestion: question
      });
    } catch (error) {
      researchThinkingMessage?.remove();
      appendAssistantMessage(
        "bot",
        error.message || "Ho provato la ricerca integrata, ma in questo momento non riesco a completarla dal web."
      );
    }
  }

});

if (heroSection) {
  heroSection.addEventListener("mousemove", (event) => {
    const rect = heroSection.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    heroSection.style.setProperty("--pointer-x", `${x}%`);
    heroSection.style.setProperty("--pointer-y", `${y}%`);
  });
}

navTriggers.forEach((trigger) => {
  const item = trigger.closest(".nav-item");
  if (!item || item.classList.contains("nav-item--simple")) return;
  trigger.setAttribute("aria-expanded", "false");
});

navTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    const item = trigger.closest(".nav-item");
    if (!item || item.classList.contains("nav-item--simple")) return;

    event.preventDefault();

    navItems.forEach((navItem) => {
      if (navItem !== item) {
        navItem.classList.remove("is-open");
        navItem.querySelector(".nav-trigger")?.setAttribute("aria-expanded", "false");
      }
    });

    item.classList.toggle("is-open");
    trigger.setAttribute("aria-expanded", String(item.classList.contains("is-open")));
  });
});

catalogNavToggle?.addEventListener("click", () => {
  setCatalogNavOpen(!catalogNav?.classList.contains("is-mobile-open"));
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".catalog-nav") || event.target.closest(".mobile-catalog-toggle-wrap")) return;
  navItems.forEach((item) => {
    item.classList.remove("is-open");
    item.querySelector(".nav-trigger")?.setAttribute("aria-expanded", "false");
  });
  setCatalogNavOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  navItems.forEach((item) => {
    item.classList.remove("is-open");
    item.querySelector(".nav-trigger")?.setAttribute("aria-expanded", "false");
  });
  setCatalogNavOpen(false);
  toggleCart(false);
  setAssistantOpen(false);
  closeProductInfoModal();
});

window.addEventListener("scroll", requestScrollChromeSync, { passive: true });
window.addEventListener("resize", syncScrollChrome);
window.addEventListener("resize", syncAssistantViewportMetrics);
window.visualViewport?.addEventListener("resize", syncAssistantViewportMetrics);
window.visualViewport?.addEventListener("scroll", syncAssistantViewportMetrics);

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
  );

  revealElements.forEach((element) => observer.observe(element));

  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCountUp(entry.target);
        countObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.45 }
  );

  countUpElements.forEach((element) => countObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
  countUpElements.forEach((element) => animateCountUp(element));
}

syncScrollChrome();
syncAssistantViewportMetrics();
setAssistantOpen(getAssistantStoredOpenState());
hydrateAdminCategorySelects();
bootstrapApp().catch((error) => {
  console.error(error);
  notifyBackendUnavailable("admin-login");
  refreshAll();
  syncAssistantAdminState();
  renderUserSession();
});
