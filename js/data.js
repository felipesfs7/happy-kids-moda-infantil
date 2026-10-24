/* ==========================================================================
   Happy Kids Moda Infantil - Dados Oficiais da Loja e Configurações
   Endereço: Rua 09, nº 865 - Centro, Santa Fé do Sul - SP
   WhatsApp: (17) 99773-2964
   Domínio Oficial: https://happykidssfs.com.br
   ========================================================================== */

const STORE_CONFIG = {
  name: "Happy Kids Moda Infantil",
  shortName: "Happy Kids",
  tagline: "Vestindo a infância com alegria, conforto e amor!",
  address: "Rua 09, nº 865 - Centro, Santa Fé do Sul - SP",
  city: "Santa Fé do Sul - SP",
  cep: "15775-000",
  phoneDisplay: "(17) 99773-2964",
  whatsappNumber: "5517997732964",
  instagram: "@happykids.santafedosul",
  hours: "Seg a Sex: 08h às 18h | Sáb: 08h às 13h",
  maxInstallments: 10,
  pixDiscountPercent: 5,
  adminPassword: "210845",
  siteUrl: "https://happykidssfs.com.br",
  cloudRepoApiUrl: "https://api.github.com/repos/felipesfs7/happy-kids-moda-infantil/contents/db/catalog-state.json",
  cloudUploadsApiBaseUrl: "https://api.github.com/repos/felipesfs7/happy-kids-moda-infantil/contents/assets/uploads",
  cloudUploadsCdnBaseUrl: "https://raw.githubusercontent.com/felipesfs7/happy-kids-moda-infantil/main/assets/uploads",
  encryptedCloudKey: "55595f675c596d091735061c0c2e02246c26241e17417452735751183b071b1c0f285b3120351f25"
};

// Régua completa de tamanhos infantis (do RN ao 18)
const ALL_SIZES = [
  "RN", "P", "M", "G",
  "1", "2", "3",
  "4", "6", "8", "10",
  "12", "14", "16", "18"
];

// Mapeamento de Faixas Etárias (Sem "RN ao G" em Bebês e até o 18)
const AGE_GROUPS = [
  { id: "todos", label: "Todas as Idades", shortLabel: "Todas as Idades", sizes: ALL_SIZES },
  { id: "bebe", label: "Bebês", shortLabel: "Bebês", sizes: ["RN", "P", "M", "G"] },
  { id: "1-a-3", label: "Primeiros Passos (1 ao 3)", shortLabel: "1 ao 3", sizes: ["1", "2", "3"] },
  { id: "4-a-10", label: "Infantil (4 ao 18)", shortLabel: "4 ao 18", sizes: ["4", "6", "8", "10", "12", "14", "16", "18"] }
];

// Categorias de Roupa (Inicia vazio para a lojista criar suas próprias categorias no painel)
const CLOTHING_CATEGORIES = [];

// Slides do Carrossel Principal (Hero Section)
const HERO_SLIDES = [
  {
    id: 1,
    badge: "NOVA COLEÇÃO HAPPY KIDS • MODA INFANTIL",
    title: "Coleções de roupas infantis cheias de estilo, conforto e alegria!",
    subtitle: "Confira nosso catálogo oficial atualizado com conjuntos, vestidos, blusas, pijamas e linha bebê. Enviamos de Santa Fé do Sul - SP para todo o Brasil em até 10x sem juros!",
    ctaPrimary: "Ver Catálogo Completo",
    ctaSecondary: "Chamar no WhatsApp",
    filterPreset: { gender: "todos", ageGroup: "todos", category: "todos" },
    bgClass: "from-[#FFF5EC] via-[#FFF9F2] to-[#EBF4FF]",
    accentColor: "#F38230",
    image: "assets/produtos/prod-002.jpg",
    floatingTag: "Coleção Oficial Happy Kids",
    floatingPrice: "Parcelamento em até 10x Sem Juros"
  },
  {
    id: 2,
    badge: "LINHA BEBÊ • CONFORTO & DELICADEZA",
    title: "Roupas macias e delicadas para os pequenos",
    subtitle: "Conjuntinhos, bodies, macacões e peças confortáveis pensadas para o bem-estar e liberdade dos bebês.",
    ctaPrimary: "Explorar Linha Bebê",
    ctaSecondary: "Ver Bodies & Macacões",
    filterPreset: { gender: "todos", ageGroup: "bebe", category: "todos" },
    bgClass: "from-[#EBF4FF] via-[#F5FAFF] to-[#FDF0F6]",
    accentColor: "#2B6EB5",
    image: "assets/produtos/prod-018.jpg",
    floatingTag: "Linha Bebê",
    floatingPrice: "Atendimento VIP via WhatsApp"
  },
  {
    id: 3,
    badge: "MENINAS & MENINOS • COLEÇÃO INFANTIL",
    title: "Conjuntos, Vestidos e Pijamas que as crianças amam vestir!",
    subtitle: "Looks modernos e cheios de personalidade para passear e brincar. Garanta já pelo site ou direto no WhatsApp da loja!",
    ctaPrimary: "Conferir Coleção Infantil",
    ctaSecondary: "Ver Conjuntos",
    filterPreset: { gender: "todos", ageGroup: "4-a-10", category: "todos" },
    bgClass: "from-[#FDF0F6] via-[#FFF8FA] to-[#FEFBEA]",
    accentColor: "#E84C93",
    image: "assets/produtos/prod-055.jpg",
    floatingTag: "Moda Infantil Completa",
    floatingPrice: "5% OFF no PIX ou 10x s/ juros"
  }
];

// Catálogo inicia zerado para cadastro gradativo pelo Lojista no Painel Administrativo
const RAW_REAL_PRODUCTS = [];
const INITIAL_PRODUCTS = [];
