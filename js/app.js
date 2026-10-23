/* ==========================================================================
   Happy Kids Moda Infantil - Core Application Controller + Cloud Database Sync
   Santa Fé do Sul - SP | WhatsApp: (17) 99773-2964
   ========================================================================== */

const STORAGE_KEYS = {
  CLOUD_CACHE: "happykids_cloud_state_v3",
  CART: "happykids_cart_v2_real",
  FAVORITES: "happykids_favorites_v2_real"
};

// Estado do Banco de Dados em Nuvem (Sincronizado para Todos os Clientes)
const CloudDB = {
  sha: null,
  unlockedToken: null,
  isSyncing: false,
  lastSyncedAt: null,
  state: {
    version: 2,
    updatedAt: null,
    soldOutIds: [],        // IDs de produtos retirados do catálogo (vendidos/esgotados)
    productOverrides: {},  // Alterações de preço, tamanhos disponíveis, nome, destaque por ID
    customProducts: [],    // Novos produtos cadastrados pelo painel do lojista
    deletedIds: []         // IDs excluídos permanentemente
  }
};

// Estado Global da Aplicação
const AppState = {
  currentView: "home", // 'home' | 'catalog' | 'product' | 'about' | 'contact' | 'admin'
  allProducts: [],     // Todos os produtos (incluindo os marcados como vendidos/esgotados para o lojista)
  products: [],        // Apenas produtos ativos/disponíveis exibidos para os clientes na vitrine
  cart: [],
  favorites: [],
  heroSlideIndex: 0,
  heroTimer: null,
  homeTab: "destaques", // 'destaques' | 'meninas' | 'meninos' | 'bebe' | 'juvenil'

  // Estado dos Filtros da Vitrine / Catálogo
  filters: {
    search: "",
    gender: "todos",
    ageGroup: "todos",
    size: "todos",
    category: "todos",
    sortBy: "relevancia"
  },

  // Estado da Página de Detalhes do Produto Atual
  activeProduct: {
    id: null,
    selectedSize: null,
    selectedImageIndex: 0,
    quantity: 1,
    activeTab: "descricao"
  },

  // Estado do Painel do Lojista (CMS) com proteção por senha (210845)
  admin: {
    isAuthenticated: false,
    quickCodeQuery: "",
    showOnlySoldOutInQuick: false,
    editingId: null,
    searchQuery: "",
    filterCategory: "todos",
    filterStockStatus: "todos", // 'todos' | 'ativos' | 'vendidos'
    uploadedImageDataUrl: ""
  }
};

/* ==========================================================================
   1. Inicialização, Banco de Dados em Nuvem e Persistência
   ========================================================================== */

function initApp() {
  loadLocalCache();
  rebuildCatalogFromState();
  renderAll();
  startHeroCarousel();
  setupGlobalListeners();

  // Busca o estado atualizado do Banco de Dados na Nuvem em tempo real
  fetchCloudDatabaseState();
}

function loadLocalCache() {
  try {
    localStorage.removeItem("happykids_products_v1");
    localStorage.removeItem("happykids_products_v2_real");

    const cachedCloud = localStorage.getItem(STORAGE_KEYS.CLOUD_CACHE);
    if (cachedCloud) {
      const parsed = JSON.parse(cachedCloud);
      if (parsed && typeof parsed === "object") {
        CloudDB.state = {
          version: 2,
          updatedAt: parsed.updatedAt || null,
          soldOutIds: Array.isArray(parsed.soldOutIds) ? parsed.soldOutIds : [],
          productOverrides: parsed.productOverrides || {},
          customProducts: Array.isArray(parsed.customProducts) ? parsed.customProducts : [],
          deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : []
        };
      }
    }

    const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
    AppState.cart = savedCart ? JSON.parse(savedCart) : [];

    const savedFavs = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    AppState.favorites = savedFavs ? JSON.parse(savedFavs) : [];
  } catch (err) {
    console.warn("Inicializando estado padrão:", err);
  }
}

function saveCloudCacheLocally() {
  try {
    localStorage.setItem(STORAGE_KEYS.CLOUD_CACHE, JSON.stringify(CloudDB.state));
  } catch (e) {}
}

// Reconstrói a lista de produtos combinando o catálogo base + alterações da nuvem
function rebuildCatalogFromState() {
  const soldOutSet = new Set(CloudDB.state.soldOutIds || []);
  const deletedSet = new Set(CloudDB.state.deletedIds || []);
  const overrides = CloudDB.state.productOverrides || {};
  const customList = Array.isArray(CloudDB.state.customProducts) ? CloudDB.state.customProducts : [];

  const mergedBase = INITIAL_PRODUCTS.filter((p) => !deletedSet.has(p.id)).map((p) => {
    const ov = overrides[p.id] || {};
    return {
      ...p,
      ...ov,
      isSoldOut: soldOutSet.has(p.id)
    };
  });

  const mergedCustom = customList
    .filter((p) => p && !deletedSet.has(p.id))
    .map((p) => {
      const ov = overrides[p.id] || {};
      return {
        ...p,
        ...ov,
        isSoldOut: soldOutSet.has(p.id)
      };
    });

  // Lista completa (para o Painel do Lojista poder ver tanto ativos quanto vendidos/retirados)
  AppState.allProducts = [...mergedCustom, ...mergedBase];

  // Lista apenas de produtos em estoque (visível para os clientes da loja)
  AppState.products = AppState.allProducts.filter((p) => !p.isSoldOut && p.sizes && p.sizes.length > 0);
}

// Descriptografa a chave de gravação na nuvem usando a senha do lojista (210845)
function unlockCloudWriteToken(password) {
  const hex = STORE_CONFIG.encryptedCloudKey || "";
  if (!hex) return null;
  const key = `${password}_happykids_salt`;
  let out = "";
  for (let i = 0; i < hex.length; i += 2) {
    const byteVal = parseInt(hex.substr(i, 2), 16);
    const keyChar = key.charCodeAt((i / 2) % key.length);
    out += String.fromCharCode(byteVal ^ keyChar);
  }
  return out;
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToUtf8(b64) {
  const clean = b64.replace(/\s/g, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Lê o estado mais recente do Banco de Dados na Nuvem (para todos os clientes)
async function fetchCloudDatabaseState() {
  updateCloudSyncBadge("syncing", "Sincronizando estoque...");
  try {
    const apiUrl = `${STORE_CONFIG.cloudRepoApiUrl}?t=${Date.now()}`;
    const headers = { Accept: "application/vnd.github+json" };
    if (CloudDB.unlockedToken) {
      headers.Authorization = `token ${CloudDB.unlockedToken}`;
    }

    const res = await fetch(apiUrl, { headers, cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      CloudDB.sha = data.sha;
      if (data.content) {
        const decodedJson = base64ToUtf8(data.content);
        const parsed = JSON.parse(decodedJson);
        applyIncomingCloudState(parsed);
        updateCloudSyncBadge("online", "Banco em Nuvem Conectado (Tempo Real)");
        return;
      }
    }

    // Fallback: leitura direta do arquivo JSON publicado
    const fallbackRes = await fetch(`db/catalog-state.json?t=${Date.now()}`, { cache: "no-store" });
    if (fallbackRes.ok) {
      const parsed = await fallbackRes.json();
      applyIncomingCloudState(parsed);
      updateCloudSyncBadge("online", "Catálogo Sincronizado");
    }
  } catch (err) {
    console.warn("Modo offline/cache local ativo:", err);
    updateCloudSyncBadge("local", "Modo Local");
  }
}

function applyIncomingCloudState(parsed) {
  if (!parsed || typeof parsed !== "object") return;
  CloudDB.state = {
    version: 2,
    updatedAt: parsed.updatedAt || new Date().toISOString(),
    soldOutIds: Array.isArray(parsed.soldOutIds) ? parsed.soldOutIds : [],
    productOverrides: parsed.productOverrides || {},
    customProducts: Array.isArray(parsed.customProducts) ? parsed.customProducts : [],
    deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : []
  };
  saveCloudCacheLocally();
  rebuildCatalogFromState();
  renderAll();
}

// Salva imediatamente qualquer alteração do lojista no Banco de Dados em Nuvem
async function syncCloudDatabase(actionDescription = "Atualização de estoque pelo Painel do Lojista") {
  CloudDB.state.updatedAt = new Date().toISOString();
  saveCloudCacheLocally();
  rebuildCatalogFromState();
  renderAll();

  if (!CloudDB.unlockedToken) {
    CloudDB.unlockedToken = unlockCloudWriteToken(STORE_CONFIG.adminPassword || "210845");
  }

  updateCloudSyncBadge("syncing", "Salvando no banco em nuvem...");

  try {
    // Caso ainda não tenha o SHA atual do arquivo na nuvem, busca primeiro
    if (!CloudDB.sha) {
      const checkRes = await fetch(`${STORE_CONFIG.cloudRepoApiUrl}?t=${Date.now()}`, {
        headers: {
          Authorization: `token ${CloudDB.unlockedToken}`,
          Accept: "application/vnd.github+json"
        },
        cache: "no-store"
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        CloudDB.sha = checkData.sha;
      }
    }

    const jsonString = JSON.stringify(CloudDB.state, null, 2);
    const bodyPayload = {
      message: `CMS Happy Kids: ${actionDescription}`,
      content: utf8ToBase64(jsonString),
      branch: "main"
    };
    if (CloudDB.sha) {
      bodyPayload.sha = CloudDB.sha;
    }

    const putRes = await fetch(STORE_CONFIG.cloudRepoApiUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${CloudDB.unlockedToken}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyPayload)
    });

    if (putRes.ok) {
      const putData = await putRes.json();
      if (putData && putData.content && putData.content.sha) {
        CloudDB.sha = putData.content.sha;
      }
      CloudDB.lastSyncedAt = new Date();
      updateCloudSyncBadge("online", "Salvo na Nuvem! Visível para todos os clientes");
    } else {
      // Se houve conflito de SHA, busca o novo SHA e tenta novamente 1 vez
      const retryGet = await fetch(`${STORE_CONFIG.cloudRepoApiUrl}?t=${Date.now()}`, {
        headers: { Authorization: `token ${CloudDB.unlockedToken}` },
        cache: "no-store"
      });
      if (retryGet.ok) {
        const retryData = await retryGet.json();
        CloudDB.sha = retryData.sha;
        bodyPayload.sha = CloudDB.sha;
        const retryPut = await fetch(STORE_CONFIG.cloudRepoApiUrl, {
          method: "PUT",
          headers: {
            Authorization: `token ${CloudDB.unlockedToken}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(bodyPayload)
        });
        if (retryPut.ok) {
          const retryPutData = await retryPut.json();
          CloudDB.sha = retryPutData.content.sha;
          updateCloudSyncBadge("online", "Salvo na Nuvem! Visível para todos os clientes");
          return;
        }
      }
      updateCloudSyncBadge("warning", "Salvo neste aparelho (aguardando rede)");
    }
  } catch (err) {
    console.warn("Erro ao sincronizar na nuvem:", err);
    updateCloudSyncBadge("warning", "Salvo neste aparelho (sem conexão)");
  }
}

function updateCloudSyncBadge(status, text) {
  const badge = document.getElementById("admin-cloud-status-badge");
  if (!badge) return;

  if (status === "syncing") {
    badge.className =
      "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/25 border border-amber-300/40 text-amber-100 font-heading font-bold text-xs";
    badge.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span><span>${text}</span>`;
  } else if (status === "online") {
    badge.className =
      "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/25 border border-emerald-300/40 text-emerald-100 font-heading font-bold text-xs";
    badge.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span><span>${text}</span>`;
  } else {
    badge.className =
      "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-slate-200 font-heading font-bold text-xs";
    badge.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-sky-400"></span><span>${text}</span>`;
  }
}

function saveCartToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(AppState.cart));
  } catch (e) {}
  updateHeaderBadges();
}

function saveFavoritesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(AppState.favorites));
  } catch (e) {}
  updateHeaderBadges();
}

/* ==========================================================================
   2. Utilitários de Formatação e Links de WhatsApp (Sem Emojis / Sem '')
   ========================================================================== */

function formatCurrency(value) {
  const num = Number(value) || 0;
  return num
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00A0/g, " ");
}

function calculateInstallment(price) {
  const installmentValue = price / STORE_CONFIG.maxInstallments;
  return `${STORE_CONFIG.maxInstallments}x de ${formatCurrency(installmentValue)} sem juros`;
}

function calculatePixPrice(price) {
  const discounted = price * (1 - STORE_CONFIG.pixDiscountPercent / 100);
  return formatCurrency(discounted);
}

function sanitizeWhatsAppText(text) {
  return String(text || "")
    .replace(/\u00A0/g, " ")
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")
    .replace(/[\u2600-\u27BF]/g, "")
    .replace(/\uFE0F/g, "");
}

function buildWhatsAppUrl(message) {
  const cleanMessage = sanitizeWhatsAppText(message);
  const encoded = encodeURIComponent(cleanMessage);
  return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encoded}`;
}

function openStoreWhatsApp(customText) {
  const defaultMsg =
    customText ||
    `Olá, equipe da *${STORE_CONFIG.name}*!\nEstou visitando o site da loja e gostaria de atendimento para escolher looks infantis.`;
  window.open(buildWhatsAppUrl(defaultMsg), "_blank", "noopener,noreferrer");
}

function shareProductOnWhatsApp(productId) {
  const product = AppState.products.find((p) => p.id === productId);
  if (!product) return;
  const shareUrl = window.location.origin + window.location.pathname;
  const text =
    `Olha que peça linda da *${STORE_CONFIG.name}*:\n` +
    `*${product.name}* (${product.sku})\n` +
    `Valor: ${formatCurrency(product.price)} (ou ${calculateInstallment(product.price)})\n` +
    `Veja no catálogo online: ${shareUrl}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(sanitizeWhatsAppText(text))}`, "_blank", "noopener,noreferrer");
}

/* ==========================================================================
   3. Proteção por Senha do Painel do Lojista (Senha: 210845)
   ========================================================================== */

function openAdminPasswordModal() {
  closeMobileMenu();
  const modal = document.getElementById("admin-auth-modal");
  const input = document.getElementById("admin-password-input");
  const errEl = document.getElementById("admin-auth-error");

  if (errEl) errEl.classList.add("hidden");
  if (input) input.value = "";
  if (modal) modal.classList.remove("hidden");

  setTimeout(() => {
    if (input) input.focus();
  }, 80);
}

function closeAdminPasswordModal() {
  const modal = document.getElementById("admin-auth-modal");
  if (modal) modal.classList.add("hidden");
}

function toggleAdminPasswordVisibility() {
  const input = document.getElementById("admin-password-input");
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
}

function handleAdminPasswordSubmit(event) {
  if (event) event.preventDefault();
  const input = document.getElementById("admin-password-input");
  const errEl = document.getElementById("admin-auth-error");
  if (!input) return;

  const entered = input.value.trim();
  const requiredPass = STORE_CONFIG.adminPassword || "210845";

  if (entered === requiredPass) {
    AppState.admin.isAuthenticated = true;
    CloudDB.unlockedToken = unlockCloudWriteToken(entered);
    closeAdminPasswordModal();
    navigateTo("admin");
    fetchCloudDatabaseState();
    showToast("Acesso liberado ao Painel do Lojista!", "success");
  } else {
    if (errEl) errEl.classList.remove("hidden");
    input.value = "";
    input.focus();
  }
}

function lockAdminPanel() {
  AppState.admin.isAuthenticated = false;
  navigateTo("home");
  showToast("Painel do Lojista bloqueado com segurança.", "info");
}

/* ==========================================================================
   4. Baixa Rápida de Estoque por Código (CÓD.) - Função Solicitada pela Lojista
   ========================================================================== */

function handleQuickCodeSearchInput(val) {
  AppState.admin.quickCodeQuery = val;
  AppState.admin.showOnlySoldOutInQuick = false;
  renderQuickCodeManager();
}

function showAllSoldOutItemsInQuick() {
  AppState.admin.quickCodeQuery = "";
  AppState.admin.showOnlySoldOutInQuick = !AppState.admin.showOnlySoldOutInQuick;
  const input = document.getElementById("admin-quick-code-input");
  if (input) input.value = "";
  renderQuickCodeManager();
}

// Retira uma peça vendida do catálogo (ou coloca de volta no catálogo com 1 clique)
function toggleProductSoldOut(productId) {
  const product = AppState.allProducts.find((p) => p.id === productId);
  if (!product) return;

  const list = CloudDB.state.soldOutIds || [];
  const idx = list.indexOf(productId);

  if (idx >= 0) {
    // Estava retirado/esgotado -> Reativar no catálogo!
    list.splice(idx, 1);
    CloudDB.state.soldOutIds = list;
    showToast(`Peça "${product.name}" (${product.sku}) REATIVADA no catálogo!`, "success");
    syncCloudDatabase(`Reativou ${product.sku} - ${product.name}`);
  } else {
    // Está ativo -> Retirar do catálogo (vendido/esgotado)!
    list.push(productId);
    CloudDB.state.soldOutIds = list;
    // Remove também de sacolas locais se estiver
    AppState.cart = AppState.cart.filter((item) => item.productId !== productId);
    saveCartToStorage();
    showToast(`Peça "${product.name}" (${product.sku}) RETIRADA do catálogo!`, "info");
    syncCloudDatabase(`Baixa de estoque: retirou ${product.sku}`);
  }
}

// Retira ou Reativa TODAS as peças/cores que possuem o mesmo CÓD. de uma só vez
function markEntireCodeSoldOut(skuCode, makeSoldOut = true) {
  const matching = AppState.allProducts.filter((p) => (p.sku || "").toLowerCase() === skuCode.toLowerCase());
  if (matching.length === 0) return;

  const set = new Set(CloudDB.state.soldOutIds || []);
  matching.forEach((p) => {
    if (makeSoldOut) {
      set.add(p.id);
    } else {
      set.delete(p.id);
    }
  });

  CloudDB.state.soldOutIds = Array.from(set);
  showToast(
    makeSoldOut
      ? `Todas as ${matching.length} peças do ${skuCode} foram retiradas do catálogo!`
      : `Todas as ${matching.length} peças do ${skuCode} voltaram ao catálogo!`,
    makeSoldOut ? "info" : "success"
  );
  syncCloudDatabase(`${makeSoldOut ? "Retirou" : "Reativou"} todo o ${skuCode}`);
}

// Permite desativar/ativar apenas 1 tamanho específico de uma peça (ex: vendeu só o Tam. 6)
function toggleSingleSizeStock(productId, size) {
  const product = AppState.allProducts.find((p) => p.id === productId);
  if (!product) return;

  const currentSizes = Array.isArray(product.sizes) ? [...product.sizes] : [];
  const idx = currentSizes.indexOf(size);

  if (idx >= 0) {
    if (currentSizes.length === 1) {
      // Se era o último tamanho disponível, pergunta ou já marca a peça inteira como esgotada
      toggleProductSoldOut(productId);
      return;
    }
    currentSizes.splice(idx, 1);
  } else {
    currentSizes.push(size);
    // Ordena os tamanhos na ordem oficial RN -> 18
    currentSizes.sort((a, b) => ALL_SIZES.indexOf(a) - ALL_SIZES.indexOf(b));
  }

  if (!CloudDB.state.productOverrides[productId]) {
    CloudDB.state.productOverrides[productId] = {};
  }
  CloudDB.state.productOverrides[productId].sizes = currentSizes;

  showToast(`Tamanhos de ${product.sku} atualizados (${currentSizes.join(", ")})!`, "success");
  syncCloudDatabase(`Atualizou tamanhos de ${product.sku}`);
}

function renderQuickCodeManager() {
  const container = document.getElementById("admin-quick-code-results");
  const soldOutCounter = document.getElementById("admin-soldout-count-badge");
  if (!container) return;

  const soldOutProducts = AppState.allProducts.filter((p) => p.isSoldOut);
  if (soldOutCounter) {
    soldOutCounter.textContent = soldOutProducts.length;
  }

  const rawQuery = (AppState.admin.quickCodeQuery || "").trim().toLowerCase();
  const cleanCodeQuery = rawQuery.replace(/^c[oó]d\.?\s*/i, "").trim();

  let matches = [];
  if (AppState.admin.showOnlySoldOutInQuick) {
    matches = soldOutProducts;
  } else if (cleanCodeQuery.length > 0) {
    matches = AppState.allProducts.filter((p) => {
      const skuClean = (p.sku || "").toLowerCase();
      const nameClean = (p.name || "").toLowerCase();
      return skuClean.includes(cleanCodeQuery) || nameClean.includes(cleanCodeQuery);
    });
  }

  if (!AppState.admin.showOnlySoldOutInQuick && cleanCodeQuery.length === 0) {
    container.innerHTML = `
      <div class="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-dashed border-slate-300 text-center">
        <p class="text-xs sm:text-sm text-slate-600">
          Digite acima os números do código da roupa (ex: <strong>21823</strong>, <strong>21889</strong>, <strong>21845</strong>) para dar baixa imediata nas peças vendidas.
        </p>
      </div>
    `;
    return;
  }

  if (matches.length === 0) {
    container.innerHTML = `
      <div class="bg-rose-50/60 rounded-2xl p-5 border border-rose-200 text-center">
        <p class="font-heading font-bold text-sm text-rose-800">
          ${
            AppState.admin.showOnlySoldOutInQuick
              ? "Nenhuma peça está marcada como esgotada/retirada no momento."
              : `Nenhum produto encontrado com o código "${AppState.admin.quickCodeQuery}".`
          }
        </p>
      </div>
    `;
    return;
  }

  // Verifica se todas as peças encontradas compartilham um mesmo código para oferecer botão em lote
  const uniqueSkus = [...new Set(matches.map((m) => m.sku))];
  const batchBarHTML =
    uniqueSkus.length === 1 && matches.length > 1
      ? `
      <div class="flex flex-wrap items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4">
        <span class="text-xs sm:text-sm font-heading font-bold text-amber-900">
          Encontradas <strong>${matches.length} variações/cores</strong> com o <strong>${uniqueSkus[0]}</strong>:
        </span>
        <div class="flex flex-wrap gap-2">
          <button onclick="markEntireCodeSoldOut('${uniqueSkus[0]}', true)"
            class="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs shadow-xs cursor-pointer">
            Retirar TODAS do ${uniqueSkus[0]}
          </button>
          <button onclick="markEntireCodeSoldOut('${uniqueSkus[0]}', false)"
            class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs shadow-xs cursor-pointer">
            Reativar TODAS do ${uniqueSkus[0]}
          </button>
        </div>
      </div>
    `
      : "";

  container.innerHTML = `
    ${batchBarHTML}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${matches
        .map((p) => {
          const img = p.images && p.images[0] ? p.images[0] : "";
          const baseProd = INITIAL_PRODUCTS.find((x) => x.id === p.id);
          const allPossibleSizesForProd = baseProd ? baseProd.sizes : p.sizes || [];

          return `
            <div class="rounded-2xl border-2 p-4 flex flex-col justify-between gap-3 transition ${
              p.isSoldOut ? "bg-rose-50/50 border-rose-300" : "bg-white border-slate-200 shadow-xs"
            }">
              <div class="flex gap-3.5">
                <img src="${img}" alt="${p.name}" class="w-20 h-20 rounded-xl object-contain bg-white border border-slate-200 shrink-0" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1 mb-1">
                    <span class="px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-heading font-extrabold text-xs">
                      ${p.sku}
                    </span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-heading font-bold ${
                      p.isSoldOut ? "bg-rose-600 text-white" : "bg-emerald-100 text-emerald-800"
                    }">
                      ${p.isSoldOut ? "RETIRADO (VENDIDO)" : "VISÍVEL NA LOJA"}
                    </span>
                  </div>
                  <h4 class="font-heading font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug">${p.name}</h4>
                  <p class="font-heading font-extrabold text-[#F38230] text-sm mt-1">${formatCurrency(p.price)}</p>
                </div>
              </div>

              <!-- Controle Rápido de Tamanhos Individuais da Peça -->
              <div class="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
                <p class="text-[11px] font-semibold text-slate-500 mb-1.5">
                  Tamanhos disponíveis (toque para desativar só 1 tamanho):
                </p>
                <div class="flex flex-wrap gap-1.5">
                  ${allPossibleSizesForProd
                    .map((sz) => {
                      const hasSize = p.sizes && p.sizes.includes(sz);
                      return `
                        <button type="button" onclick="toggleSingleSizeStock('${p.id}', '${sz}')"
                          class="px-2.5 py-1 rounded-lg font-heading font-bold text-xs border transition cursor-pointer ${
                            hasSize && !p.isSoldOut
                              ? "bg-white border-emerald-400 text-emerald-800 shadow-2xs hover:bg-rose-50"
                              : "bg-slate-200/70 border-slate-300 text-slate-400 line-through"
                          }">
                          ${sz}
                        </button>
                      `;
                    })
                    .join("")}
                </div>
              </div>

              <!-- Botão Principal de 1 Clique: Retirar do Catálogo ou Reativar -->
              ${
                p.isSoldOut
                  ? `
                  <button type="button" onclick="toggleProductSoldOut('${p.id}')"
                    class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer">
                    <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                    <span>Colocar de Volta no Catálogo</span>
                  </button>
                `
                  : `
                  <button type="button" onclick="toggleProductSoldOut('${p.id}')"
                    class="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer">
                    <i data-lucide="eye-off" class="w-4 h-4"></i>
                    <span>Retirar do Catálogo (Já Vendido)</span>
                  </button>
                `
              }
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  refreshIcons();
}

/* ==========================================================================
   5. Navegação SPA entre Páginas e Filtros Rápidos
   ========================================================================== */

function navigateTo(viewName, options = {}) {
  if (viewName === "admin" && !AppState.admin.isAuthenticated) {
    openAdminPasswordModal();
    return;
  }

  AppState.currentView = viewName;

  const views = ["home", "catalog", "product", "about", "contact", "admin"];
  views.forEach((v) => {
    const el = document.getElementById(`view-${v}`);
    if (el) {
      if (v === viewName) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    }
  });

  updateActiveNavLinks();
  closeMobileMenu();

  if (viewName === "home") {
    renderHomeProducts();
    renderSizeQuickBar();
  } else if (viewName === "catalog") {
    renderCatalogView();
  } else if (viewName === "product") {
    renderProductDetailView();
  } else if (viewName === "admin") {
    renderAdminView();
  }

  if (!options.keepScroll) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function navigateWithFilter(preset = {}) {
  AppState.filters = {
    search: preset.search !== undefined ? preset.search : "",
    gender: preset.gender || "todos",
    ageGroup: preset.ageGroup || "todos",
    size: preset.size || "todos",
    category: preset.category || "todos",
    sortBy: preset.sortBy || "relevancia"
  };
  navigateTo("catalog");
}

function updateActiveNavLinks() {
  document.querySelectorAll("[data-nav-btn]").forEach((btn) => {
    const target = btn.getAttribute("data-nav-btn");
    let isActive = false;

    if (target === "home" && AppState.currentView === "home") isActive = true;
    if (target === "catalog" && AppState.currentView === "catalog" && AppState.filters.gender === "todos" && AppState.filters.ageGroup === "todos") isActive = true;
    if (target === "meninas" && AppState.currentView === "catalog" && AppState.filters.gender === "Feminino") isActive = true;
    if (target === "meninos" && AppState.currentView === "catalog" && AppState.filters.gender === "Masculino") isActive = true;
    if (target === "bebes" && AppState.currentView === "catalog" && AppState.filters.ageGroup === "bebe") isActive = true;
    if (target === "juvenil" && AppState.currentView === "catalog" && AppState.filters.ageGroup === "juvenil") isActive = true;
    if (target === "about" && AppState.currentView === "about") isActive = true;
    if (target === "contact" && AppState.currentView === "contact") isActive = true;
    if (target === "admin" && AppState.currentView === "admin") isActive = true;

    if (isActive) {
      btn.classList.add("text-[#F38230]", "font-bold");
      btn.classList.remove("text-slate-700");
    } else {
      btn.classList.remove("text-[#F38230]", "font-bold");
      btn.classList.add("text-slate-700");
    }
  });
}

/* ==========================================================================
   6. Renderização Global & Carrossel Hero (Home)
   ========================================================================== */

function renderAll() {
  updateHeaderBadges();
  renderHeroSlide();
  renderSizeQuickBar();
  renderHomeProducts();
  renderCatalogFiltersUI();
  renderCatalogView();
  renderAdminView();
}

function renderHeroSlide() {
  const container = document.getElementById("hero-carousel-container");
  if (!container) return;

  const slide = HERO_SLIDES[AppState.heroSlideIndex];

  container.innerHTML = `
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r ${slide.bgClass} border border-orange-100/80 shadow-sm transition-all duration-500">
      <div class="grid grid-cols-1 lg:grid-cols-12 items-center min-h-[420px] lg:min-h-[470px]">
        
        <!-- Coluna de Texto e Chamada (CTA) -->
        <div class="lg:col-span-7 p-6 sm:p-10 lg:p-14 z-10 animate-fade-in">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-orange-200 text-xs sm:text-sm font-bold text-[#F38230] shadow-sm mb-4">
            <span>${slide.badge}</span>
          </div>
          
          <h1 class="font-heading text-2xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 leading-[1.18] tracking-tight mb-4">
            ${slide.title}
          </h1>
          
          <p class="text-slate-600 text-sm sm:text-base lg:text-lg leading-relaxed mb-7 max-w-xl">
            ${slide.subtitle}
          </p>
          
          <div class="flex flex-wrap items-center gap-3.5">
            <button onclick='navigateWithFilter(${JSON.stringify(slide.filterPreset)})'
              class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#F38230] hover:bg-[#DC6B19] text-white font-heading font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer">
              <i data-lucide="sparkles" class="w-5 h-5"></i>
              <span>${slide.ctaPrimary}</span>
            </button>
            
            <button onclick="openStoreWhatsApp('Olá! Vi o destaque no site da Happy Kids e gostaria de atendimento!')"
              class="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border-2 border-slate-200 hover:border-emerald-400 font-heading font-semibold text-sm sm:text-base transition-all cursor-pointer">
              <i data-lucide="message-circle" class="w-5 h-5 text-[#25D366]"></i>
              <span>Atendimento no WhatsApp</span>
            </button>
          </div>

          <!-- Selos Rápidos no Banner -->
          <div class="mt-7 pt-5 border-t border-slate-200/70 flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-slate-600">
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-[#2CB667]"></span>
              <span>Estoque Atualizado em Tempo Real</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-[#2B6EB5]"></span>
              <span>10x Sem Juros</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-[#F38230]"></span>
              <span>Santa Fé do Sul - SP</span>
            </div>
          </div>
        </div>

        <!-- Coluna da Imagem em Destaque -->
        <div class="lg:col-span-5 relative h-80 sm:h-96 lg:h-[470px] w-full overflow-hidden bg-white/50 flex items-center justify-center p-4">
          <img src="${slide.image}" alt="${slide.title}"
            class="w-full h-full object-contain rounded-2xl transform hover:scale-105 transition-transform duration-700" />
          
          <!-- Card Flutuante Lúdico -->
          <div class="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-float">
            <div class="w-11 h-11 rounded-xl bg-orange-100 text-[#F38230] flex items-center justify-center shrink-0 font-heading font-extrabold text-xs">
              RN-16
            </div>
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-[#2B6EB5]">${slide.floatingTag}</p>
              <p class="text-sm font-heading font-bold text-slate-900">${slide.floatingPrice}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Controles do Carrossel -->
      <div class="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-slate-200/60">
        ${HERO_SLIDES.map(
          (s, idx) => `
          <button onclick="goToHeroSlide(${idx})" aria-label="Slide ${idx + 1}"
            class="h-2.5 rounded-full transition-all cursor-pointer ${
              idx === AppState.heroSlideIndex ? "w-7 bg-[#F38230]" : "w-2.5 bg-slate-300 hover:bg-slate-400"
            }"></button>
        `
        ).join("")}
      </div>

      <button onclick="prevHeroSlide()" aria-label="Slide Anterior"
        class="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-md items-center justify-center transition cursor-pointer">
        <i data-lucide="chevron-left" class="w-5 h-5"></i>
      </button>
      <button onclick="nextHeroSlide()" aria-label="Próximo Slide"
        class="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-md items-center justify-center transition cursor-pointer">
        <i data-lucide="chevron-right" class="w-5 h-5"></i>
      </button>
    </div>
  `;

  refreshIcons();
}

function startHeroCarousel() {
  if (AppState.heroTimer) clearInterval(AppState.heroTimer);
  AppState.heroTimer = setInterval(() => {
    if (AppState.currentView === "home") {
      AppState.heroSlideIndex = (AppState.heroSlideIndex + 1) % HERO_SLIDES.length;
      renderHeroSlide();
    }
  }, 6500);
}

function nextHeroSlide() {
  AppState.heroSlideIndex = (AppState.heroSlideIndex + 1) % HERO_SLIDES.length;
  renderHeroSlide();
  startHeroCarousel();
}

function prevHeroSlide() {
  AppState.heroSlideIndex = (AppState.heroSlideIndex - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
  renderHeroSlide();
  startHeroCarousel();
}

function goToHeroSlide(index) {
  AppState.heroSlideIndex = index;
  renderHeroSlide();
  startHeroCarousel();
}

function renderSizeQuickBar() {
  const container = document.getElementById("home-size-ruler");
  if (!container) return;

  container.innerHTML = ALL_SIZES.map((sz) => {
    const isBaby = ["RN", "P", "M", "G"].includes(sz);
    const isTeen = ["12", "14", "16", "18"].includes(sz);
    const colorClasses = isBaby
      ? "bg-sky-50 border-sky-200 text-sky-800 hover:bg-[#2B6EB5] hover:text-white hover:border-[#2B6EB5]"
      : isTeen
      ? "bg-pink-50 border-pink-200 text-pink-800 hover:bg-[#E84C93] hover:text-white hover:border-[#E84C93]"
      : "bg-orange-50 border-orange-200 text-orange-800 hover:bg-[#F38230] hover:text-white hover:border-[#F38230]";

    return `
      <button onclick="navigateWithFilter({ size: '${sz}' })"
        class="group flex flex-col items-center justify-center min-w-[54px] sm:min-w-[62px] h-[58px] sm:h-[64px] rounded-2xl border-2 ${colorClasses} font-heading transition-all transform hover:-translate-y-1 shadow-xs cursor-pointer">
        <span class="text-[10px] uppercase tracking-wider opacity-75 font-semibold">${isBaby ? "Bebê" : "Tam."}</span>
        <span class="text-base sm:text-lg font-extrabold leading-none mt-0.5">${sz}</span>
      </button>
    `;
  }).join("");
}

/* ==========================================================================
   7. Cards de Produto e Vitrine em Destaque na Home
   ========================================================================== */

function setHomeTab(tabName) {
  AppState.homeTab = tabName;
  document.querySelectorAll("[data-home-tab]").forEach((btn) => {
    const t = btn.getAttribute("data-home-tab");
    if (t === tabName) {
      btn.className =
        "px-4 py-2 rounded-full font-heading font-bold text-xs sm:text-sm bg-[#F38230] text-white shadow-sm transition cursor-pointer";
    } else {
      btn.className =
        "px-4 py-2 rounded-full font-heading font-semibold text-xs sm:text-sm bg-white text-slate-600 hover:bg-orange-50 hover:text-[#F38230] border border-slate-200 transition cursor-pointer";
    }
  });
  renderHomeProducts();
}

function renderHomeProducts() {
  const grid = document.getElementById("home-featured-grid");
  if (!grid) return;

  let list = [...AppState.products];

  if (AppState.homeTab === "destaques") {
    const featuredOnly = list.filter((p) => p.featured);
    list = featuredOnly.length > 0 ? featuredOnly : list;
  } else if (AppState.homeTab === "meninas") {
    list = list.filter((p) => p.gender === "Feminino" || p.gender === "Unissex");
  } else if (AppState.homeTab === "meninos") {
    list = list.filter((p) => p.gender === "Masculino" || p.gender === "Unissex");
  } else if (AppState.homeTab === "bebe") {
    list = list.filter((p) => p.ageGroup === "bebe" || p.sizes.some((s) => ["RN", "P", "M", "G"].includes(s)));
  } else if (AppState.homeTab === "juvenil") {
    list = list.filter((p) => p.ageGroup === "juvenil" || p.sizes.some((s) => ["10", "12", "14", "16", "18"].includes(s)));
  }

  const displayList = list.slice(0, 12);

  if (displayList.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full bg-white rounded-3xl p-10 text-center border border-slate-200">
        <p class="text-slate-600 font-medium mb-4">Nenhum produto encontrado nesta aba no momento.</p>
        <button onclick="setHomeTab('destaques')" class="px-5 py-2.5 rounded-xl bg-[#F38230] text-white font-bold text-sm">
          Ver Todos os Destaques
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = displayList.map((product) => createProductCardHTML(product)).join("");
  refreshIcons();
}

function createProductCardHTML(product) {
  const isFav = AppState.favorites.includes(product.id);
  const mainImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : "assets/produtos/prod-001.jpg";

  const hasDiscount = product.oldPrice && Number(product.oldPrice) > Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const genderBadgeClass =
    product.gender === "Feminino"
      ? "bg-pink-50 text-pink-700 border-pink-200"
      : product.gender === "Masculino"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : "bg-amber-50 text-amber-800 border-amber-200";

  const sizesPreview = (product.sizes || []).slice(0, 6);
  const extraSizesCount = (product.sizes || []).length - sizesPreview.length;

  return `
    <article class="product-card bg-white rounded-3xl border border-slate-200/90 overflow-hidden flex flex-col justify-between group relative">
      
      <!-- Topo / Imagem do Produto -->
      <div>
        <div class="relative aspect-square bg-white overflow-hidden cursor-pointer" onclick="openProductDetail('${product.id}')">
          <img src="${mainImage}" alt="${product.name}" loading="lazy"
            class="product-img-zoom w-full h-full object-contain object-center p-1" />
          
          <!-- Badges Superiores Esquerda -->
          <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            ${
              product.badge
                ? `<span class="px-2.5 py-1 rounded-full text-[11px] font-heading font-bold bg-white/95 backdrop-blur-xs text-[#2B6EB5] shadow-xs border border-blue-100">
                    ${product.badge}
                  </span>`
                : ""
            }
            ${
              hasDiscount
                ? `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-heading font-extrabold bg-[#D92344] text-white shadow-xs w-fit">
                    -${discountPercent}% OFF
                  </span>`
                : ""
            }
          </div>

          <!-- Botão Favoritar Direita -->
          <button onclick="event.stopPropagation(); toggleFavorite('${product.id}')"
            aria-label="Adicionar aos Favoritos"
            class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full ${
              isFav ? "bg-rose-500 text-white" : "bg-white/90 hover:bg-white text-slate-600 hover:text-rose-500"
            } shadow-md flex items-center justify-center transition cursor-pointer">
            <i data-lucide="heart" class="w-4 h-4 ${isFav ? "fill-current" : ""}"></i>
          </button>

          <!-- Faixa Etária no Canto Inferior da Foto -->
          <div class="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            <span class="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold">
              ${product.ageLabel || "RN ao 16"}
            </span>
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${genderBadgeClass}">
              ${product.gender}
            </span>
          </div>
        </div>

        <!-- Corpo do Card -->
        <div class="p-4 sm:p-5">
          <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span class="font-medium text-[#2B6EB5]">${product.category}</span>
            <span class="text-[11px] font-bold text-slate-500">${product.sku || ""}</span>
          </div>

          <h3 onclick="openProductDetail('${product.id}')"
            class="font-heading font-bold text-slate-800 hover:text-[#F38230] text-sm sm:text-base line-clamp-2 min-h-[42px] leading-snug transition cursor-pointer mb-2.5">
            ${product.name}
          </h3>

          <!-- Preview de Tamanhos Disponíveis -->
          <div class="flex flex-wrap items-center gap-1 mb-3">
            ${sizesPreview
              .map(
                (sz) =>
                  `<span class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200">${sz}</span>`
              )
              .join("")}
            ${
              extraSizesCount > 0
                ? `<span class="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-50 text-[#F38230]">+${extraSizesCount}</span>`
                : ""
            }
          </div>

          <!-- Bloco de Preço e Parcelamento -->
          <div class="pt-2 border-t border-slate-100">
            ${
              hasDiscount
                ? `<p class="text-xs text-slate-400 line-through">${formatCurrency(product.oldPrice)}</p>`
                : `<p class="text-xs text-emerald-600 font-medium">Disponível na Loja</p>`
            }
            <div class="flex items-baseline gap-1.5 mt-0.5">
              <span class="font-heading text-lg sm:text-xl font-extrabold text-slate-900">
                ${formatCurrency(product.price)}
              </span>
              <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                ${calculatePixPrice(product.price)} no PIX
              </span>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5">
              ou <strong class="text-slate-700">${calculateInstallment(product.price)}</strong>
            </p>
          </div>
        </div>
      </div>

      <!-- Botões de Ação Rápida -->
      <div class="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 grid grid-cols-2 gap-2">
        <button onclick="openProductDetail('${product.id}')"
          class="py-2.5 px-3 rounded-xl border-2 border-slate-200 hover:border-[#2B6EB5] text-slate-700 hover:text-[#2B6EB5] font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer">
          <i data-lucide="eye" class="w-3.5 h-3.5"></i>
          <span>Detalhes</span>
        </button>

        <button onclick="quickBuyProduct('${product.id}')"
          class="py-2.5 px-3 rounded-xl bg-[#F38230] hover:bg-[#DC6B19] text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-orange-500/20 transition cursor-pointer">
          <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
          <span>Comprar</span>
        </button>
      </div>
    </article>
  `;
}

/* ==========================================================================
   8. Página de Catálogo / Vitrine com Filtros e Ordenação (Requisito B)
   ========================================================================== */

function renderCatalogFiltersUI() {
  const sizeFilterContainer = document.getElementById("catalog-filter-sizes");
  if (sizeFilterContainer) {
    sizeFilterContainer.innerHTML = `
      <button onclick="setCatalogFilter('size', 'todos')"
        class="px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
          AppState.filters.size === "todos"
            ? "bg-[#F38230] text-white border-[#F38230]"
            : "bg-white text-slate-700 border-slate-200 hover:border-orange-300"
        }">
        Todos
      </button>
      ${ALL_SIZES.map(
        (sz) => `
        <button onclick="setCatalogFilter('size', '${sz}')"
          class="min-w-[38px] py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
            AppState.filters.size === sz
              ? "bg-[#F38230] text-white border-[#F38230] shadow-xs"
              : "bg-white text-slate-700 border-slate-200 hover:border-orange-300"
          }">
          ${sz}
        </button>
      `
      ).join("")}
    `;
  }
}

function setCatalogFilter(key, value) {
  AppState.filters[key] = value;
  renderCatalogFiltersUI();
  renderCatalogView();
}

function resetCatalogFilters() {
  AppState.filters = {
    search: "",
    gender: "todos",
    ageGroup: "todos",
    size: "todos",
    category: "todos",
    sortBy: "relevancia"
  };
  const searchInput = document.getElementById("catalog-search-input");
  if (searchInput) searchInput.value = "";
  const headerSearch = document.getElementById("header-search-input");
  if (headerSearch) headerSearch.value = "";

  renderCatalogFiltersUI();
  renderCatalogView();
}

function getFilteredAndSortedProducts() {
  const { search, gender, ageGroup, size, category, sortBy } = AppState.filters;
  const query = (search || "").trim().toLowerCase();

  let filtered = AppState.products.filter((p) => {
    if (query) {
      const hay = `${p.name} ${p.category} ${p.gender} ${p.description} ${p.sku || ""} ${p.ageLabel || ""}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }

    if (gender !== "todos") {
      if (gender === "Unissex" && p.gender !== "Unissex") return false;
      if (gender === "Feminino" && p.gender !== "Feminino" && p.gender !== "Unissex") return false;
      if (gender === "Masculino" && p.gender !== "Masculino" && p.gender !== "Unissex") return false;
    }

    if (ageGroup !== "todos") {
      const groupObj = AGE_GROUPS.find((g) => g.id === ageGroup);
      const matchesGroup = p.ageGroup === ageGroup || (groupObj && p.sizes.some((s) => groupObj.sizes.includes(s)));
      if (!matchesGroup) return false;
    }

    if (size !== "todos") {
      if (!p.sizes || !p.sizes.includes(size)) return false;
    }

    if (category !== "todos") {
      if (p.category !== category) return false;
    }

    return true;
  });

  if (sortBy === "menor-preco") {
    filtered.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortBy === "maior-preco") {
    filtered.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sortBy === "mais-recentes") {
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } else {
    filtered.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }

  return filtered;
}

function renderCatalogView() {
  document.querySelectorAll("[data-filter-gender]").forEach((el) => {
    const val = el.getAttribute("data-filter-gender");
    const active = AppState.filters.gender === val;
    el.className = `w-full text-left px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between transition cursor-pointer ${
      active ? "bg-orange-50 text-[#F38230] font-bold border border-orange-200" : "text-slate-600 hover:bg-slate-50"
    }`;
  });

  document.querySelectorAll("[data-filter-age]").forEach((el) => {
    const val = el.getAttribute("data-filter-age");
    const active = AppState.filters.ageGroup === val;
    el.className = `w-full text-left px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between transition cursor-pointer ${
      active ? "bg-blue-50 text-[#2B6EB5] font-bold border border-blue-200" : "text-slate-600 hover:bg-slate-50"
    }`;
  });

  document.querySelectorAll("[data-filter-category]").forEach((el) => {
    const val = el.getAttribute("data-filter-category");
    const active = AppState.filters.category === val;
    el.className = `w-full text-left px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between transition cursor-pointer ${
      active ? "bg-orange-50 text-[#F38230] font-bold border border-orange-200" : "text-slate-600 hover:bg-slate-50"
    }`;
  });

  const sortSelect = document.getElementById("catalog-sort-select");
  if (sortSelect) sortSelect.value = AppState.filters.sortBy;

  const searchInput = document.getElementById("catalog-search-input");
  if (searchInput && document.activeElement !== searchInput) {
    searchInput.value = AppState.filters.search;
  }

  renderCatalogFiltersUI();

  const chipsContainer = document.getElementById("catalog-active-chips");
  const activeChips = [];
  if (AppState.filters.search) activeChips.push({ label: `Busca: "${AppState.filters.search}"`, key: "search", reset: "" });
  if (AppState.filters.gender !== "todos") activeChips.push({ label: `Gênero: ${AppState.filters.gender}`, key: "gender", reset: "todos" });
  if (AppState.filters.ageGroup !== "todos") {
    const g = AGE_GROUPS.find((x) => x.id === AppState.filters.ageGroup);
    activeChips.push({ label: `Idade: ${g ? g.shortLabel : AppState.filters.ageGroup}`, key: "ageGroup", reset: "todos" });
  }
  if (AppState.filters.size !== "todos") activeChips.push({ label: `Tamanho: ${AppState.filters.size}`, key: "size", reset: "todos" });
  if (AppState.filters.category !== "todos") activeChips.push({ label: `Categoria: ${AppState.filters.category}`, key: "category", reset: "todos" });

  if (chipsContainer) {
    if (activeChips.length === 0) {
      chipsContainer.innerHTML = `<span class="text-xs text-slate-500">Mostrando catálogo oficial Happy Kids em estoque</span>`;
    } else {
      chipsContainer.innerHTML =
        activeChips
          .map(
            (chip) => `
          <button onclick="setCatalogFilter('${chip.key}', '${chip.reset}')"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/80 hover:bg-orange-200 text-[#F38230] text-xs font-bold transition cursor-pointer">
            <span>${chip.label}</span>
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
          </button>
        `
          )
          .join("") +
        `<button onclick="resetCatalogFilters()" class="text-xs font-semibold text-slate-500 hover:text-rose-600 underline ml-2 cursor-pointer">Limpar tudo</button>`;
    }
  }

  const results = getFilteredAndSortedProducts();
  const countEl = document.getElementById("catalog-results-count");
  if (countEl) {
    countEl.textContent = `${results.length} ${results.length === 1 ? "produto disponível" : "produtos disponíveis"}`;
  }

  const grid = document.getElementById("catalog-products-grid");
  if (!grid) return;

  if (results.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200 shadow-xs">
        <div class="w-16 h-16 rounded-2xl bg-orange-50 text-[#F38230] flex items-center justify-center mx-auto mb-4">
          <i data-lucide="search-x" class="w-8 h-8"></i>
        </div>
        <h3 class="font-heading text-xl font-bold text-slate-800 mb-2">Nenhuma roupinha encontrada com esses filtros</h3>
        <p class="text-slate-500 text-sm max-w-md mx-auto mb-6">
          Experimente limpar algum filtro ou chame nossa equipe no WhatsApp — recebemos novidades toda semana na loja em Santa Fé do Sul!
        </p>
        <div class="flex flex-wrap justify-center gap-3">
          <button onclick="resetCatalogFilters()"
            class="px-5 py-2.5 rounded-xl bg-[#F38230] text-white font-heading font-bold text-sm cursor-pointer">
            Limpar Filtros e Ver Tudo
          </button>
          <button onclick="openStoreWhatsApp('Olá! Estou procurando uma peça específica no site da Happy Kids e gostaria de ajuda!')"
            class="px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-heading font-bold text-sm cursor-pointer">
            Consultar Estoque no WhatsApp
          </button>
        </div>
      </div>
    `;
  } else {
    grid.innerHTML = results.map((p) => createProductCardHTML(p)).join("");
  }

  refreshIcons();
}

/* ==========================================================================
   9. Página de Detalhes do Produto com Zoom e Compra Direta no WhatsApp
   ========================================================================== */

function openProductDetail(productId) {
  const product = AppState.products.find((p) => p.id === productId) || AppState.allProducts.find((p) => p.id === productId);
  if (!product) return;

  AppState.activeProduct = {
    id: product.id,
    selectedSize: product.sizes && product.sizes.length > 0 ? product.sizes[0] : "P",
    selectedImageIndex: 0,
    quantity: 1,
    activeTab: "descricao"
  };

  navigateTo("product");
}

function quickBuyProduct(productId) {
  openProductDetail(productId);
}

function selectProductSize(size) {
  AppState.activeProduct.selectedSize = size;
  renderProductDetailView();
}

function selectProductImage(index) {
  AppState.activeProduct.selectedImageIndex = index;
  renderProductDetailView();
}

function changeProductQuantity(delta) {
  const next = AppState.activeProduct.quantity + delta;
  if (next >= 1 && next <= 20) {
    AppState.activeProduct.quantity = next;
    renderProductDetailView();
  }
}

function setProductDetailTab(tabName) {
  AppState.activeProduct.activeTab = tabName;
  renderProductDetailView();
}

function renderProductDetailView() {
  const container = document.getElementById("product-detail-container");
  if (!container) return;

  const product =
    AppState.products.find((p) => p.id === AppState.activeProduct.id) ||
    AppState.allProducts.find((p) => p.id === AppState.activeProduct.id) ||
    AppState.products[0];
  if (!product) return;

  AppState.activeProduct.id = product.id;
  if (!AppState.activeProduct.selectedSize && product.sizes && product.sizes.length > 0) {
    AppState.activeProduct.selectedSize = product.sizes[0];
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
      : ["assets/produtos/prod-001.jpg"];

  const currentImg = images[AppState.activeProduct.selectedImageIndex] || images[0];
  const isFav = AppState.favorites.includes(product.id);
  const hasDiscount = product.oldPrice && Number(product.oldPrice) > Number(product.price);

  const related = AppState.products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.ageGroup === product.ageGroup))
    .slice(0, 4);

  container.innerHTML = `
    <!-- Breadcrumb -->
    <nav class="flex flex-wrap items-center justify-between gap-2 mb-6 text-xs sm:text-sm text-slate-500">
      <div class="flex items-center gap-2">
        <button onclick="navigateTo('home')" class="hover:text-[#F38230] cursor-pointer">Início</button>
        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>
        <button onclick="navigateWithFilter({ category: '${product.category}' })" class="hover:text-[#F38230] cursor-pointer">${product.category}</button>
        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>
        <span class="text-slate-800 font-semibold line-clamp-1">${product.name}</span>
      </div>
      <button onclick="navigateTo('catalog')" class="inline-flex items-center gap-1.5 text-[#2B6EB5] font-semibold hover:underline cursor-pointer">
        <i data-lucide="arrow-left" class="w-4 h-4"></i>
        <span>Voltar ao Catálogo</span>
      </button>
    </nav>

    <!-- Card Principal do Produto -->
    <div class="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 lg:p-10 shadow-xs mb-12">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        <!-- Galeria de Imagens com Zoom (Coluna Esquerda - 6 cols) -->
        <div class="lg:col-span-6 flex flex-col gap-4">
          <div id="product-zoom-box"
            onmousemove="handleImageZoomMove(event)"
            onmouseleave="handleImageZoomLeave(event)"
            onclick="openLightbox('${currentImg}', '${product.name.replace(/'/g, "")}')"
            class="zoom-container relative aspect-square rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-inner group">
            <img id="product-main-image" src="${currentImg}" alt="${product.name}"
              class="w-full h-full object-contain object-center" />
            
            <div class="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
              ${
                product.badge
                  ? `<span class="px-3 py-1 rounded-full text-xs font-heading font-bold bg-white/95 text-[#2B6EB5] shadow-sm border border-blue-100">${product.badge}</span>`
                  : ""
              }
            </div>

            <div class="absolute bottom-3 right-3 bg-slate-900/75 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none">
              <i data-lucide="zoom-in" class="w-3.5 h-3.5"></i>
              <span>Passe o mouse ou toque para ampliar</span>
            </div>
          </div>

          ${
            images.length > 1
              ? `
            <div>
              <p class="text-xs font-heading font-bold text-slate-500 mb-2">Fotos e variações deste mesmo modelo (${product.sku}):</p>
              <div class="flex items-center gap-3 overflow-x-auto pb-1">
                ${images
                  .map(
                    (imgUrl, idx) => `
                  <button onclick="selectProductImage(${idx})"
                    class="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 bg-white transition shrink-0 cursor-pointer ${
                      idx === AppState.activeProduct.selectedImageIndex
                        ? "border-[#F38230] ring-2 ring-orange-200"
                        : "border-slate-200 opacity-75 hover:opacity-100"
                    }">
                    <img src="${imgUrl}" alt="Foto ${idx + 1}" class="w-full h-full object-contain" />
                  </button>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }
        </div>

        <!-- Informações, Seletor RN-18 e Botões de Conversão (Coluna Direita - 6 cols) -->
        <div class="lg:col-span-6 flex flex-col justify-between">
          <div>
            <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2B6EB5]">${product.category}</span>
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-[#F38230]">${product.gender}</span>
                <span class="px-2.5 py-0.5 rounded-md bg-slate-100 text-xs font-extrabold text-slate-700">${product.sku || product.id}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <button onclick="shareProductOnWhatsApp('${product.id}')" title="Compartilhar peça no WhatsApp"
                  class="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-[#25D366] transition cursor-pointer">
                  <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
                  <span>Compartilhar</span>
                </button>
                <button onclick="toggleFavorite('${product.id}'); renderProductDetailView();"
                  class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition cursor-pointer ${
                    isFav
                      ? "bg-rose-50 border-rose-200 text-rose-600"
                      : "bg-white border-slate-200 text-slate-600 hover:text-rose-500"
                  }">
                  <i data-lucide="heart" class="w-4 h-4 ${isFav ? "fill-current" : ""}"></i>
                  <span>${isFav ? "Favorito" : "Favoritar"}</span>
                </button>
              </div>
            </div>

            <h1 class="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-4">
              ${product.name}
            </h1>

            <!-- Bloco de Preços de Alta Conversão -->
            <div class="bg-[#FAF8F5] rounded-2xl p-4 sm:p-5 border border-slate-200/80 mb-6">
              ${
                hasDiscount
                  ? `<p class="text-xs sm:text-sm text-slate-400 line-through">De: ${formatCurrency(product.oldPrice)}</p>`
                  : ""
              }
              <div class="flex flex-wrap items-baseline gap-3">
                <span class="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900">
                  ${formatCurrency(product.price)}
                </span>
                <span class="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-heading font-bold text-xs sm:text-sm">
                  ${calculatePixPrice(product.price)} no PIX (5% OFF)
                </span>
              </div>
              <p class="text-xs sm:text-sm text-slate-600 mt-1.5 flex items-center gap-1.5">
                <i data-lucide="credit-card" class="w-4 h-4 text-[#2B6EB5]"></i>
                <span>Em até <strong>${calculateInstallment(product.price)}</strong> no cartão</span>
              </p>
            </div>

            <!-- Seletor Completo de Tamanhos (RN ao 18) -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-2.5">
                <label class="font-heading font-bold text-sm text-slate-800 flex items-center gap-2">
                  <span>Escolha o Tamanho:</span>
                  <span class="px-2.5 py-0.5 rounded-md bg-orange-100 text-[#F38230] text-xs font-extrabold">
                    Selecionado: ${AppState.activeProduct.selectedSize}
                  </span>
                </label>
                <button onclick="openSizeGuideModal()"
                  class="inline-flex items-center gap-1 text-xs font-bold text-[#2B6EB5] hover:underline cursor-pointer">
                  <i data-lucide="ruler" class="w-3.5 h-3.5"></i>
                  <span>Guia de Medidas (RN ao 18)</span>
                </button>
              </div>

              <p class="text-xs text-slate-500 mb-3">
                Grade disponível em estoque (${product.ageLabel}). Toque no tamanho desejado:
              </p>

              <div class="grid grid-cols-5 sm:grid-cols-8 gap-2">
                ${ALL_SIZES.map((sz) => {
                  const isAvailable = product.sizes && product.sizes.includes(sz);
                  const isSelected = AppState.activeProduct.selectedSize === sz;
                  return `
                    <button
                      ${isAvailable ? `onclick="selectProductSize('${sz}')"` : "disabled"}
                      class="size-pill rounded-xl border-2 font-heading font-bold text-xs sm:text-sm flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? "selected"
                          : isAvailable
                          ? "bg-white border-slate-200 text-slate-800"
                          : "border-slate-200 text-slate-400"
                      }">
                      ${sz}
                    </button>
                  `;
                }).join("")}
              </div>
            </div>

            <!-- Quantidade e Estoque -->
            <div class="flex flex-wrap items-center gap-4 mb-6">
              <div class="flex items-center border-2 border-slate-200 rounded-xl bg-white">
                <button onclick="changeProductQuantity(-1)" class="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-[#F38230] font-bold cursor-pointer">-</button>
                <span class="w-10 text-center font-heading font-bold text-sm text-slate-900">${AppState.activeProduct.quantity}</span>
                <button onclick="changeProductQuantity(1)" class="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-[#F38230] font-bold cursor-pointer">+</button>
              </div>
              <div class="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Disponível na loja física e para envio imediato!</span>
              </div>
            </div>

            <!-- Botões Principais de Conversão (Sacola + WhatsApp Direto Formatado) -->
            <div class="flex flex-col sm:flex-row gap-3 mb-6">
              <button onclick="addActiveProductToCart()"
                class="flex-1 py-4 px-6 rounded-2xl bg-[#F38230] hover:bg-[#DC6B19] text-white font-heading font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2.5 transition transform hover:-translate-y-0.5 cursor-pointer">
                <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                <span>Adicionar à Sacola</span>
              </button>

              <button onclick="buyActiveProductViaWhatsApp()"
                class="flex-1 py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#1DA851] text-white font-heading font-bold text-sm sm:text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition transform hover:-translate-y-0.5 cursor-pointer">
                <i data-lucide="message-circle" class="w-5 h-5"></i>
                <span>Comprar direto pelo WhatsApp</span>
              </button>
            </div>

            <!-- Diferenciais Rápidos na Página de Produto -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div class="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl">
                <i data-lucide="truck" class="w-4 h-4 text-[#2B6EB5] shrink-0"></i>
                <span>Enviamos para <strong>todo o Brasil</strong> com rastreio</span>
              </div>
              <div class="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl">
                <i data-lucide="map-pin" class="w-4 h-4 text-[#F38230] shrink-0"></i>
                <span>Retire Grátis: <strong>Rua 09, nº 865 - Santa Fé do Sul</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Abas de Descrição Detalhada, Composição do Tecido e Instruções de Lavagem -->
      <div class="mt-10 pt-8 border-t border-slate-200">
        <div class="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-6">
          <button onclick="setProductDetailTab('descricao')"
            class="px-4 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm transition cursor-pointer ${
              AppState.activeProduct.activeTab === "descricao"
                ? "bg-[#2B6EB5] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }">
            Descrição & Detalhes
          </button>
          <button onclick="setProductDetailTab('tecido')"
            class="px-4 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm transition cursor-pointer ${
              AppState.activeProduct.activeTab === "tecido"
                ? "bg-[#2B6EB5] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }">
            Tecido & Composição
          </button>
          <button onclick="setProductDetailTab('lavagem')"
            class="px-4 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm transition cursor-pointer ${
              AppState.activeProduct.activeTab === "lavagem"
                ? "bg-[#2B6EB5] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }">
            Instruções de Lavagem
          </button>
        </div>

        <div class="bg-[#FAF8F5] rounded-2xl p-5 sm:p-7 border border-slate-200/70">
          ${
            AppState.activeProduct.activeTab === "descricao"
              ? `
              <h3 class="font-heading font-bold text-lg text-slate-900 mb-2">Sobre a peça: ${product.name}</h3>
              <p class="text-slate-700 text-sm sm:text-base leading-relaxed mb-4">${product.description}</p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200/70 text-xs sm:text-sm">
                <div><strong class="text-slate-900">Código:</strong> ${product.sku || product.id}</div>
                <div><strong class="text-slate-900">Gênero:</strong> ${product.gender}</div>
                <div><strong class="text-slate-900">Grade disponível:</strong> ${(product.sizes || []).join(", ")}</div>
              </div>
            `
              : AppState.activeProduct.activeTab === "tecido"
              ? `
              <h3 class="font-heading font-bold text-lg text-slate-900 mb-2">Qualidade do Tecido e Composição</h3>
              <p class="text-slate-700 text-sm sm:text-base leading-relaxed mb-3">${
                product.fabric || "Tecido selecionado 100% pensado no conforto térmico e liberdade de movimentos da criança."
              }</p>
              <p class="text-xs text-slate-500">
                Todas as peças da Happy Kids Moda Infantil passam por curadoria rigorosa de acabamento, costuras macias e toque gentil na pele infantil.
              </p>
            `
              : `
              <h3 class="font-heading font-bold text-lg text-slate-900 mb-3">Cuidados e Instruções de Lavagem</h3>
              <ul class="space-y-2 text-sm text-slate-700">
                ${(
                  product.washing || [
                    "Lavar com cores similares e sabão neutro",
                    "Não utilizar alvejante à base de cloro",
                    "Secar preferencialmente à sombra"
                  ]
                )
                  .map(
                    (item) => `
                  <li class="flex items-center gap-2.5">
                    <span class="w-5 h-5 rounded-full bg-sky-100 text-[#2B6EB5] flex items-center justify-center text-xs font-bold">✓</span>
                    <span>${item}</span>
                  </li>
                `
                  )
                  .join("")}
              </ul>
            `
          }
        </div>
      </div>
    </div>

    <!-- Produtos Relacionados -->
    ${
      related.length > 0
        ? `
      <div class="mt-8">
        <h2 class="font-heading text-xl sm:text-2xl font-extrabold text-slate-900 mb-5">
          Combine o Look / Veja Também
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          ${related.map((p) => createProductCardHTML(p)).join("")}
        </div>
      </div>
    `
        : ""
    }
  `;

  refreshIcons();
}

function handleImageZoomMove(event) {
  const box = document.getElementById("product-zoom-box");
  const img = document.getElementById("product-main-image");
  if (!box || !img) return;

  const rect = box.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  box.classList.add("zoomed");
  img.style.transformOrigin = `${x}% ${y}%`;
}

function handleImageZoomLeave() {
  const box = document.getElementById("product-zoom-box");
  const img = document.getElementById("product-main-image");
  if (!box || !img) return;

  box.classList.remove("zoomed");
  img.style.transformOrigin = "center center";
}

function openLightbox(imageUrl, caption) {
  const modal = document.getElementById("lightbox-modal");
  const img = document.getElementById("lightbox-image");
  const cap = document.getElementById("lightbox-caption");
  if (!modal || !img) return;

  img.src = imageUrl;
  if (cap) cap.textContent = caption || "";
  modal.classList.remove("hidden");
}

function closeLightbox() {
  const modal = document.getElementById("lightbox-modal");
  if (modal) modal.classList.add("hidden");
}

function buyActiveProductViaWhatsApp() {
  const product = AppState.products.find((p) => p.id === AppState.activeProduct.id) || AppState.allProducts.find((p) => p.id === AppState.activeProduct.id);
  if (!product) return;

  const size = AppState.activeProduct.selectedSize || (product.sizes && product.sizes[0]) || "Único";
  const qty = AppState.activeProduct.quantity || 1;
  const total = product.price * qty;

  const message =
    `Olá, *${STORE_CONFIG.name}*!\n` +
    `Quero comprar este produto que vi no site:\n\n` +
    `- *Produto:* ${product.name}\n` +
    `- *Código:* ${product.sku || product.id}\n` +
    `- *Tamanho Escolhido:* ${size}\n` +
    `- *Quantidade:* ${qty} un.\n` +
    `- *Valor Unitário:* ${formatCurrency(product.price)} (${formatCurrency(total)} no total)\n\n` +
    `Podem me confirmar a disponibilidade para envio/retirada?`;

  openStoreWhatsApp(message);
  showToast(`Redirecionando para o WhatsApp da Happy Kids (Tam: ${size})!`, "success");
}

/* ==========================================================================
   10. Sacola de Compras (Carrinho) e Favoritos
   ========================================================================== */

function addActiveProductToCart() {
  const product = AppState.products.find((p) => p.id === AppState.activeProduct.id);
  if (!product) return;

  const size = AppState.activeProduct.selectedSize || (product.sizes && product.sizes[0]) || "U";
  const qty = AppState.activeProduct.quantity || 1;

  const existingIndex = AppState.cart.findIndex((item) => item.productId === product.id && item.size === size);

  if (existingIndex >= 0) {
    AppState.cart[existingIndex].quantity += qty;
  } else {
    AppState.cart.push({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.images && product.images[0] ? product.images[0] : "",
      size: size,
      quantity: qty,
      sku: product.sku || product.id
    });
  }

  saveCartToStorage();
  renderCartDrawer();
  openCartDrawer();
  showToast(`"${product.name}" (Tam. ${size}) adicionado à sacola!`, "success");
}

function updateCartItemQty(index, delta) {
  if (!AppState.cart[index]) return;
  AppState.cart[index].quantity += delta;
  if (AppState.cart[index].quantity <= 0) {
    AppState.cart.splice(index, 1);
  }
  saveCartToStorage();
  renderCartDrawer();
}

function removeCartItem(index) {
  AppState.cart.splice(index, 1);
  saveCartToStorage();
  renderCartDrawer();
}

function clearCart() {
  AppState.cart = [];
  saveCartToStorage();
  renderCartDrawer();
}

function openCartDrawer() {
  renderCartDrawer();
  const drawer = document.getElementById("cart-drawer");
  if (drawer) drawer.classList.remove("hidden");
}

function closeCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  if (drawer) drawer.classList.add("hidden");
}

function renderCartDrawer() {
  const listEl = document.getElementById("cart-items-list");
  const footerEl = document.getElementById("cart-drawer-footer");
  if (!listEl || !footerEl) return;

  if (AppState.cart.length === 0) {
    listEl.innerHTML = `
      <div class="text-center py-14 px-4">
        <div class="w-16 h-16 rounded-full bg-orange-50 text-[#F38230] flex items-center justify-center mx-auto mb-4">
          <i data-lucide="shopping-bag" class="w-8 h-8"></i>
        </div>
        <h4 class="font-heading font-bold text-slate-800 text-lg mb-1">Sua sacola está vazia</h4>
        <p class="text-slate-500 text-xs sm:text-sm mb-6">
          Escolha looks lindos no catálogo e adicione à sua sacola!
        </p>
        <button onclick="closeCartDrawer(); navigateTo('catalog');"
          class="px-5 py-2.5 rounded-xl bg-[#F38230] text-white font-heading font-bold text-sm cursor-pointer">
          Explorar Catálogo
        </button>
      </div>
    `;
    footerEl.innerHTML = "";
    refreshIcons();
    return;
  }

  let subtotal = 0;
  listEl.innerHTML = AppState.cart
    .map((item, idx) => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      return `
        <div class="flex gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <img src="${item.image}" alt="${item.name}" class="w-18 h-20 rounded-xl object-contain shrink-0 bg-white p-1 border border-slate-100" />
          <div class="flex-1 min-w-0">
            <h4 class="font-heading font-bold text-slate-800 text-xs sm:text-sm line-clamp-1">${item.name}</h4>
            <p class="text-xs text-slate-500 mt-0.5">
              Tamanho: <strong class="text-[#F38230]">${item.size}</strong> • <span class="text-slate-400">${item.sku || ""}</span>
            </p>
            <p class="font-heading font-extrabold text-slate-900 text-sm mt-1">${formatCurrency(itemTotal)}</p>
            
            <div class="flex items-center justify-between mt-2">
              <div class="inline-flex items-center border border-slate-200 rounded-lg bg-white">
                <button onclick="updateCartItemQty(${idx}, -1)" class="w-7 h-7 text-xs font-bold text-slate-600 hover:text-[#F38230] cursor-pointer">-</button>
                <span class="px-2 text-xs font-bold">${item.quantity}</span>
                <button onclick="updateCartItemQty(${idx}, 1)" class="w-7 h-7 text-xs font-bold text-slate-600 hover:text-[#F38230] cursor-pointer">+</button>
              </div>
              <button onclick="removeCartItem(${idx})" class="text-xs text-rose-500 hover:underline flex items-center gap-1 cursor-pointer">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>Remover</span>
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  const deliveryOptionEl = document.querySelector('input[name="cart-delivery-mode"]:checked');
  const deliveryMode = deliveryOptionEl ? deliveryOptionEl.value : "retirada";

  footerEl.innerHTML = `
    <div class="space-y-3 border-t border-slate-200 pt-4">
      <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
        <p class="font-heading font-bold text-slate-700">Modalidade de Entrega:</p>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="cart-delivery-mode" value="envio" ${deliveryMode === "envio" ? "checked" : ""} class="accent-[#F38230]" />
          <span>Envio para meu endereço (Correios / Transportadora)</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="cart-delivery-mode" value="retirada" ${deliveryMode !== "envio" ? "checked" : ""} class="accent-[#F38230]" />
          <span>Retirar Grátis na Loja (Santa Fé do Sul - SP)</span>
        </label>
      </div>

      <div class="flex items-center justify-between text-sm">
        <span class="text-slate-600">Total do Pedido:</span>
        <div class="text-right">
          <p class="font-heading text-xl font-extrabold text-slate-900">${formatCurrency(subtotal)}</p>
          <p class="text-[11px] text-emerald-700 font-semibold">${calculatePixPrice(subtotal)} no PIX ou ${calculateInstallment(subtotal)}</p>
        </div>
      </div>

      <button onclick="checkoutCartViaWhatsApp()"
        class="w-full py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#1DA851] text-white font-heading font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer">
        <i data-lucide="message-circle" class="w-5 h-5"></i>
        <span>Finalizar Pedido pelo WhatsApp</span>
      </button>

      <button onclick="clearCart()" class="w-full text-center text-xs text-slate-400 hover:text-rose-500 py-1 cursor-pointer">
        Esvaziar Sacola
      </button>
    </div>
  `;

  refreshIcons();
}

function checkoutCartViaWhatsApp() {
  if (AppState.cart.length === 0) return;

  const deliveryOptionEl = document.querySelector('input[name="cart-delivery-mode"]:checked');
  const deliveryText =
    deliveryOptionEl && deliveryOptionEl.value === "envio"
      ? "Envio pelos Correios / Transportadora"
      : "Retirada na Loja Física (Rua 09, nº 865 - Santa Fé do Sul)";

  let subtotal = 0;
  const itemsLines = AppState.cart
    .map((item, i) => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;
      return `${i + 1}. *${item.name}* (${item.sku || ""}) | Tam: *${item.size}* | Qtd: ${item.quantity} | ${formatCurrency(lineTotal)}`;
    })
    .join("\n");

  const message =
    `Olá, *${STORE_CONFIG.name}*!\n` +
    `Montei minha sacola no site e gostaria de finalizar meu pedido:\n\n` +
    `${itemsLines}\n\n` +
    `- *Subtotal:* ${formatCurrency(subtotal)}\n` +
    `- *Opção no PIX (5% OFF):* ${calculatePixPrice(subtotal)}\n` +
    `- *Parcelamento:* até ${calculateInstallment(subtotal)}\n` +
    `- *Entrega:* ${deliveryText}\n\n` +
    `Aguardo retorno para combinarmos o pagamento!`;

  openStoreWhatsApp(message);
}

function toggleFavorite(productId) {
  const idx = AppState.favorites.indexOf(productId);
  if (idx >= 0) {
    AppState.favorites.splice(idx, 1);
    showToast("Item removido dos seus Favoritos.", "info");
  } else {
    AppState.favorites.push(productId);
    showToast("Salvo na sua lista de Favoritos!", "success");
  }
  saveFavoritesToStorage();
  if (AppState.currentView === "home") renderHomeProducts();
  if (AppState.currentView === "catalog") renderCatalogView();
}

function openFavoritesDrawer() {
  renderFavoritesDrawer();
  const el = document.getElementById("favorites-drawer");
  if (el) el.classList.remove("hidden");
}

function closeFavoritesDrawer() {
  const el = document.getElementById("favorites-drawer");
  if (el) el.classList.add("hidden");
}

function renderFavoritesDrawer() {
  const listEl = document.getElementById("favorites-items-list");
  if (!listEl) return;

  const favProducts = AppState.products.filter((p) => AppState.favorites.includes(p.id));

  if (favProducts.length === 0) {
    listEl.innerHTML = `
      <div class="text-center py-14 px-4">
        <div class="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <i data-lucide="heart" class="w-8 h-8"></i>
        </div>
        <h4 class="font-heading font-bold text-slate-800 text-lg mb-1">Sua lista de desejos está vazia</h4>
        <p class="text-slate-500 text-xs sm:text-sm mb-6">
          Toque no coração nos produtos que você mais gostar para guardar aqui!
        </p>
      </div>
    `;
    refreshIcons();
    return;
  }

  listEl.innerHTML = favProducts
    .map(
      (p) => `
      <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
        <img src="${p.images && p.images[0] ? p.images[0] : ""}" alt="${p.name}" class="w-16 h-16 rounded-xl object-contain bg-white shrink-0" />
        <div class="flex-1 min-w-0">
          <h4 class="font-heading font-bold text-slate-800 text-xs sm:text-sm line-clamp-1">${p.name}</h4>
          <p class="text-xs text-[#F38230] font-bold mt-0.5">${formatCurrency(p.price)}</p>
          <div class="flex items-center gap-2 mt-2">
            <button onclick="closeFavoritesDrawer(); openProductDetail('${p.id}');"
              class="text-xs font-bold text-[#2B6EB5] hover:underline cursor-pointer">
              Ver Produto
            </button>
            <span class="text-slate-300">•</span>
            <button onclick="toggleFavorite('${p.id}'); renderFavoritesDrawer();"
              class="text-xs text-rose-500 hover:underline cursor-pointer">
              Remover
            </button>
          </div>
        </div>
      </div>
    `
    )
    .join("");

  refreshIcons();
}

function updateHeaderBadges() {
  const totalCartItems = AppState.cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartBadges = document.querySelectorAll(".cart-count-badge");
  cartBadges.forEach((b) => {
    b.textContent = totalCartItems;
    b.classList.toggle("hidden", totalCartItems === 0);
  });

  const favCount = AppState.favorites.length;
  const favBadges = document.querySelectorAll(".fav-count-badge");
  favBadges.forEach((b) => {
    b.textContent = favCount;
    b.classList.toggle("hidden", favCount === 0);
  });
}

/* ==========================================================================
   11. Painel Administrativo / CMS do Lojista c/ Sincronização em Nuvem
   ========================================================================== */

function renderAdminView() {
  const totalActive = AppState.products.length;
  const totalSoldOut = AppState.allProducts.filter((p) => p.isSoldOut).length;
  const featuredCount = AppState.products.filter((p) => p.featured).length;
  const avgPrice =
    totalActive > 0
      ? AppState.products.reduce((acc, p) => acc + Number(p.price || 0), 0) / totalActive
      : 0;

  const kpiTotal = document.getElementById("admin-kpi-total");
  const kpiSoldOut = document.getElementById("admin-kpi-soldout");
  const kpiFeatured = document.getElementById("admin-kpi-featured");
  const kpiAvg = document.getElementById("admin-kpi-avg");

  if (kpiTotal) kpiTotal.textContent = totalActive;
  if (kpiSoldOut) kpiSoldOut.textContent = totalSoldOut;
  if (kpiFeatured) kpiFeatured.textContent = featuredCount;
  if (kpiAvg) kpiAvg.textContent = formatCurrency(avgPrice);

  const sizesCheckContainer = document.getElementById("admin-sizes-checkboxes");
  if (sizesCheckContainer && sizesCheckContainer.children.length === 0) {
    sizesCheckContainer.innerHTML = ALL_SIZES.map(
      (sz) => `
      <label class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-[#F38230] cursor-pointer select-none text-xs font-heading font-bold text-slate-700 has-[:checked]:bg-orange-50 has-[:checked]:border-[#F38230] has-[:checked]:text-[#F38230]">
        <input type="checkbox" name="admin-size-item" value="${sz}" class="accent-[#F38230] w-3.5 h-3.5" />
        <span>${sz}</span>
      </label>
    `
    ).join("");
  }

  renderQuickCodeManager();
  renderAdminProductsTable();
}

function selectAdminSizePreset(preset) {
  const checkboxes = document.querySelectorAll('input[name="admin-size-item"]');
  checkboxes.forEach((cb) => {
    const val = cb.value;
    if (preset === "all") cb.checked = true;
    else if (preset === "none") cb.checked = false;
    else if (preset === "bebe") cb.checked = ["RN", "P", "M", "G"].includes(val);
    else if (preset === "1-3") cb.checked = ["1", "2", "3"].includes(val);
    else if (preset === "4-10") cb.checked = ["4", "6", "8", "10"].includes(val);
    else if (preset === "juvenil") cb.checked = ["12", "14", "16", "18"].includes(val);
  });
}

function handleAdminImageUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const maxDim = 650;
      let width = img.width;
      let height = img.height;

      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

      AppState.admin.uploadedImageDataUrl = dataUrl;
      const urlInput = document.getElementById("admin-prod-image-url");
      if (urlInput) urlInput.value = dataUrl;
      updateAdminImagePreview(dataUrl);
      showToast("Imagem carregada com sucesso!", "success");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function updateAdminImagePreview(src) {
  const previewImg = document.getElementById("admin-image-preview");
  const placeholder = document.getElementById("admin-image-placeholder");
  if (!previewImg || !placeholder) return;

  if (src && src.trim() !== "") {
    previewImg.src = src;
    previewImg.classList.remove("hidden");
    placeholder.classList.add("hidden");
  } else {
    previewImg.src = "";
    previewImg.classList.add("hidden");
    placeholder.classList.remove("hidden");
  }
}

function handleAdminFormSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("admin-prod-name").value.trim();
  const price = parseFloat(document.getElementById("admin-prod-price").value);
  const oldPriceRaw = document.getElementById("admin-prod-old-price").value;
  const oldPrice = oldPriceRaw ? parseFloat(oldPriceRaw) : null;
  const gender = document.getElementById("admin-prod-gender").value;
  const category = document.getElementById("admin-prod-category").value;
  const ageGroup = document.getElementById("admin-prod-age-group").value;
  const badge = document.getElementById("admin-prod-badge").value.trim();
  const featured = document.getElementById("admin-prod-featured").checked;
  const imageUrl = document.getElementById("admin-prod-image-url").value.trim();
  const description = document.getElementById("admin-prod-description").value.trim();
  const fabric = document.getElementById("admin-prod-fabric").value.trim();

  const selectedSizes = Array.from(document.querySelectorAll('input[name="admin-size-item"]:checked')).map(
    (cb) => cb.value
  );

  if (!name || isNaN(price) || price <= 0) {
    showToast("Por favor, preencha o nome e um preço válido.", "warning");
    return;
  }

  if (selectedSizes.length === 0) {
    showToast("Selecione pelo menos um tamanho disponível (do RN ao 18).", "warning");
    return;
  }

  const ageObj = AGE_GROUPS.find((g) => g.id === ageGroup);
  const ageLabel =
    selectedSizes.length === 1
      ? `Tam. ${selectedSizes[0]}`
      : `Tam. ${selectedSizes[0]} ao ${selectedSizes[selectedSizes.length - 1]}`;

  const finalImage =
    imageUrl ||
    AppState.admin.uploadedImageDataUrl ||
    "assets/produtos/prod-001.jpg";

  if (AppState.admin.editingId) {
    const prodId = AppState.admin.editingId;
    const existing = AppState.allProducts.find((p) => p.id === prodId);
    if (existing) {
      const updatedImages = [finalImage, ...(existing.images ? existing.images.slice(1) : [])];
      const overridePayload = {
        name,
        price,
        oldPrice,
        gender,
        category,
        ageGroup,
        ageLabel: ageLabel || (ageObj ? ageObj.shortLabel : "RN ao 16"),
        sizes: selectedSizes,
        badge: badge || "Destaque",
        featured,
        images: updatedImages,
        description:
          description ||
          "Peça confeccionada com carinho, conforto e alta durabilidade para acompanhar a criança em todos os momentos.",
        fabric: fabric || "Algodão Premium macio e respirável."
      };

      // Se for produto customizado ou do catálogo base, salva no CloudDB
      const customIdx = CloudDB.state.customProducts.findIndex((c) => c.id === prodId);
      if (customIdx >= 0) {
        CloudDB.state.customProducts[customIdx] = {
          ...CloudDB.state.customProducts[customIdx],
          ...overridePayload
        };
      } else {
        CloudDB.state.productOverrides[prodId] = overridePayload;
      }

      showToast(`Produto "${name}" atualizado na nuvem!`, "success");
      resetAdminForm();
      syncCloudDatabase(`Editou produto ${existing.sku || prodId}`);
    }
  } else {
    const newId = "hk-custom-" + Date.now().toString().slice(-6);
    const customCodeInput = document.getElementById("admin-prod-sku");
    const rawCustomCode = customCodeInput ? customCodeInput.value.trim() : "";
    const newSku = rawCustomCode
      ? rawCustomCode.toUpperCase().startsWith("CÓD")
        ? rawCustomCode
        : `CÓD. ${rawCustomCode}`
      : `CÓD. ${Math.floor(21900 + Math.random() * 900)}`;

    const newProduct = {
      id: newId,
      sku: newSku,
      name,
      price,
      oldPrice,
      gender,
      category,
      ageGroup,
      ageLabel,
      sizes: selectedSizes,
      badge: badge || "Novo",
      featured,
      images: [finalImage],
      description:
        description ||
        "Peça especial da coleção Happy Kids Moda Infantil, unindo conforto, liberdade de movimento e muito estilo.",
      fabric: fabric || "Tecido selecionado de toque macio e alta durabilidade.",
      washing: [
        "Lavar com cores similares e sabão neutro",
        "Não utilizar alvejantes com cloro",
        "Secar à sombra"
      ],
      createdAt: new Date().toISOString().split("T")[0]
    };

    CloudDB.state.customProducts.unshift(newProduct);
    showToast(`Novo produto "${name}" (${newSku}) publicado na nuvem!`, "success");
    resetAdminForm();
    syncCloudDatabase(`Cadastrou novo produto ${newSku}`);
  }
}

function editProductInAdmin(productId) {
  const product = AppState.allProducts.find((p) => p.id === productId);
  if (!product) return;

  AppState.admin.editingId = product.id;

  document.getElementById("admin-form-title").textContent = `Editando: ${product.name}`;
  document.getElementById("admin-submit-btn-text").textContent = "Salvar Alterações na Nuvem";
  document.getElementById("admin-cancel-edit-btn").classList.remove("hidden");

  document.getElementById("admin-prod-name").value = product.name || "";
  const skuInput = document.getElementById("admin-prod-sku");
  if (skuInput) skuInput.value = (product.sku || "").replace(/^CÓD\.\s*/i, "");
  document.getElementById("admin-prod-price").value = product.price || "";
  document.getElementById("admin-prod-old-price").value = product.oldPrice || "";
  document.getElementById("admin-prod-gender").value = product.gender || "Feminino";
  document.getElementById("admin-prod-category").value = product.category || "Conjuntos";
  document.getElementById("admin-prod-age-group").value = product.ageGroup || "4-a-10";
  document.getElementById("admin-prod-badge").value = product.badge || "";
  document.getElementById("admin-prod-featured").checked = Boolean(product.featured);

  const mainImg = product.images && product.images[0] ? product.images[0] : "";
  document.getElementById("admin-prod-image-url").value = mainImg;
  updateAdminImagePreview(mainImg);

  document.getElementById("admin-prod-description").value = product.description || "";
  document.getElementById("admin-prod-fabric").value = product.fabric || "";

  document.querySelectorAll('input[name="admin-size-item"]').forEach((cb) => {
    cb.checked = product.sizes && product.sizes.includes(cb.value);
  });

  const formCard = document.getElementById("admin-form-card");
  if (formCard) formCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetAdminForm() {
  AppState.admin.editingId = null;
  AppState.admin.uploadedImageDataUrl = "";

  const form = document.getElementById("admin-product-form");
  if (form) form.reset();

  const title = document.getElementById("admin-form-title");
  if (title) title.textContent = "Cadastrar Novo Produto no Catálogo";

  const btnText = document.getElementById("admin-submit-btn-text");
  if (btnText) btnText.textContent = "Publicar Produto na Loja";

  const cancelBtn = document.getElementById("admin-cancel-edit-btn");
  if (cancelBtn) cancelBtn.classList.add("hidden");

  updateAdminImagePreview("");
}

function deleteProductFromAdmin(productId) {
  // Em vez de apagar sem volta, alterna o status de Retirado/Vendido (ou reativa se já estava retirado)
  toggleProductSoldOut(productId);
}

function toggleProductFeaturedAdmin(productId) {
  const product = AppState.allProducts.find((p) => p.id === productId);
  if (!product) return;

  const nextFeatured = !product.featured;
  if (!CloudDB.state.productOverrides[productId]) {
    CloudDB.state.productOverrides[productId] = {};
  }
  CloudDB.state.productOverrides[productId].featured = nextFeatured;

  showToast(
    nextFeatured ? `"${product.name}" adicionado aos Destaques da Home!` : `"${product.name}" removido dos Destaques.`,
    "success"
  );
  syncCloudDatabase(`Alterou destaque de ${product.sku}`);
}

function restoreDefaultCatalog() {
  CloudDB.state = {
    version: 2,
    updatedAt: new Date().toISOString(),
    soldOutIds: [],
    productOverrides: {},
    customProducts: [],
    deletedIds: []
  };
  resetAdminForm();
  showToast("Todas as 99 peças do catálogo oficial foram reativadas na nuvem!", "success");
  syncCloudDatabase("Restaurou catalogo completo (99 pecas ativas)");
}

function renderAdminProductsTable() {
  const tbody = document.getElementById("admin-products-tbody");
  if (!tbody) return;

  const q = (AppState.admin.searchQuery || "").trim().toLowerCase();
  const cat = AppState.admin.filterCategory || "todos";
  const stockFilter = AppState.admin.filterStockStatus || "todos";

  const filtered = AppState.allProducts.filter((p) => {
    if (cat !== "todos" && p.category !== cat) return false;
    if (stockFilter === "ativos" && p.isSoldOut) return false;
    if (stockFilter === "vendidos" && !p.isSoldOut) return false;
    if (q) {
      const hay = `${p.name} ${p.sku || ""} ${p.category} ${p.gender}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-10 text-center text-slate-500 text-sm">
          Nenhum produto encontrado com esses filtros no gerenciamento.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered
    .map((p) => {
      const img = p.images && p.images[0] ? p.images[0] : "";
      return `
        <tr class="border-b border-slate-100 transition ${
          p.isSoldOut ? "bg-rose-50/40 opacity-75" : "hover:bg-slate-50/80"
        }">
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-3">
              <img src="${img}" alt="${p.name}" class="w-12 h-12 rounded-xl object-contain border border-slate-200 shrink-0 bg-white" />
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded bg-slate-900 text-white font-heading font-bold text-[10px]">${p.sku || p.id}</span>
                  ${
                    p.isSoldOut
                      ? `<span class="px-2 py-0.5 rounded bg-rose-600 text-white font-heading font-bold text-[10px]">RETIRADO / VENDIDO</span>`
                      : `<span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-heading font-bold text-[10px]">EM ESTOQUE</span>`
                  }
                </div>
                <p class="font-heading font-bold text-slate-800 text-xs sm:text-sm line-clamp-1 mt-1">${p.name}</p>
              </div>
            </div>
          </td>
          <td class="py-3.5 px-4">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2B6EB5]">${p.category}</span>
          </td>
          <td class="py-3.5 px-4">
            <div class="flex flex-wrap gap-1 max-w-[180px]">
              ${(p.sizes || [])
                .map((s) => `<span class="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded">${s}</span>`)
                .join("")}
            </div>
          </td>
          <td class="py-3.5 px-4">
            <p class="font-heading font-extrabold text-slate-900 text-sm">${formatCurrency(p.price)}</p>
          </td>
          <td class="py-3.5 px-4 text-center">
            <button onclick="toggleProductFeaturedAdmin('${p.id}')"
              title="Alternar Destaque na Home"
              class="p-2 rounded-xl border transition cursor-pointer ${
                p.featured
                  ? "bg-amber-50 border-amber-200 text-amber-500"
                  : "bg-white border-slate-200 text-slate-300 hover:text-amber-400"
              }">
              <i data-lucide="star" class="w-4 h-4 ${p.featured ? "fill-current" : ""}"></i>
            </button>
          </td>
          <td class="py-3.5 px-4 text-right">
            <div class="inline-flex items-center gap-1.5">
              <button onclick="editProductInAdmin('${p.id}')" title="Editar Preço / Tamanhos"
                class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-[#2B6EB5] text-[#2B6EB5] hover:text-white font-heading font-bold text-xs flex items-center gap-1 transition cursor-pointer">
                <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                <span>Editar</span>
              </button>
              ${
                p.isSoldOut
                  ? `
                  <button onclick="toggleProductSoldOut('${p.id}')" title="Reativar no Catálogo"
                    class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs flex items-center gap-1 transition cursor-pointer">
                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                    <span>Reativar</span>
                  </button>
                `
                  : `
                  <button onclick="toggleProductSoldOut('${p.id}')" title="Retirar do Catálogo (Peça Vendida)"
                    class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-heading font-bold text-xs flex items-center gap-1 transition cursor-pointer">
                    <i data-lucide="eye-off" class="w-3.5 h-3.5"></i>
                    <span>Retirar (Vendido)</span>
                  </button>
                `
              }
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  refreshIcons();
}

/* ==========================================================================
   12. Modais, Menu Mobile, Guia de Tamanhos e Notificações (Toast)
   ========================================================================== */

function openMobileMenu() {
  const m = document.getElementById("mobile-menu-drawer");
  if (m) m.classList.remove("hidden");
}

function closeMobileMenu() {
  const m = document.getElementById("mobile-menu-drawer");
  if (m) m.classList.add("hidden");
}

function openSizeGuideModal() {
  const m = document.getElementById("size-guide-modal");
  if (m) m.classList.remove("hidden");
}

function closeSizeGuideModal() {
  const m = document.getElementById("size-guide-modal");
  if (m) m.classList.add("hidden");
}

function openMobileFiltersDrawer() {
  const sidebar = document.getElementById("catalog-filters-sidebar");
  if (sidebar) {
    sidebar.classList.remove("hidden");
    sidebar.classList.add("fixed", "inset-0", "z-50", "bg-white", "p-6", "overflow-y-auto");
  }
}

function closeMobileFiltersDrawer() {
  const sidebar = document.getElementById("catalog-filters-sidebar");
  if (sidebar) {
    sidebar.classList.add("hidden");
    sidebar.classList.remove("fixed", "inset-0", "z-50", "bg-white", "p-6", "overflow-y-auto");
  }
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  const bgClass =
    type === "warning"
      ? "bg-amber-600 text-white"
      : type === "info"
      ? "bg-slate-800 text-white"
      : "bg-emerald-600 text-white";

  toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl font-heading font-semibold text-xs sm:text-sm ${bgClass} animate-fade-in`;
  toast.innerHTML = `
    <span class="w-2 h-2 rounded-full bg-white shrink-0"></span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3400);
}

function setupGlobalListeners() {
  const headerSearch = document.getElementById("header-search-input");
  if (headerSearch) {
    headerSearch.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        navigateWithFilter({ search: headerSearch.value });
      }
    });
  }

  const catalogSearch = document.getElementById("catalog-search-input");
  if (catalogSearch) {
    catalogSearch.addEventListener("input", (e) => {
      AppState.filters.search = e.target.value;
      renderCatalogView();
    });
  }

  const adminSearch = document.getElementById("admin-search-input");
  if (adminSearch) {
    adminSearch.addEventListener("input", (e) => {
      AppState.admin.searchQuery = e.target.value;
      renderAdminProductsTable();
    });
  }

  const adminCatFilter = document.getElementById("admin-filter-category");
  if (adminCatFilter) {
    adminCatFilter.addEventListener("change", (e) => {
      AppState.admin.filterCategory = e.target.value;
      renderAdminProductsTable();
    });
  }

  const adminStockFilter = document.getElementById("admin-filter-stock");
  if (adminStockFilter) {
    adminStockFilter.addEventListener("change", (e) => {
      AppState.admin.filterStockStatus = e.target.value;
      renderAdminProductsTable();
    });
  }

  const adminImgUrl = document.getElementById("admin-prod-image-url");
  if (adminImgUrl) {
    adminImgUrl.addEventListener("input", (e) => {
      updateAdminImagePreview(e.target.value);
    });
  }
}

function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

document.addEventListener("DOMContentLoaded", initApp);
