/* ==========================================================================
   Happy Kids Moda Infantil - Dados Oficiais da Loja e Catálogo Real (99 Peças)
   Endereço: Rua 09, nº 865 - Centro, Santa Fé do Sul - SP
   WhatsApp: (17) 99773-2964
   ========================================================================== */

const STORE_CONFIG = {
  name: "Happy Kids Moda Infantil",
  shortName: "Happy Kids",
  tagline: "Vestindo a infância com alegria, conforto e amor do RN ao 18!",
  address: "Rua 09, nº 865 - Centro, Santa Fé do Sul - SP",
  city: "Santa Fé do Sul - SP",
  cep: "15775-000",
  phoneDisplay: "(17) 99773-2964",
  whatsappNumber: "5517997732964",
  instagram: "@happykids.santafedosul",
  hours: "Seg a Sex: 09h às 18h | Sáb: 09h às 13h",
  maxInstallments: 10,
  pixDiscountPercent: 5,
  adminPassword: "210845",
  cloudRepoApiUrl: "https://api.github.com/repos/felipesfs7/happy-kids-moda-infantil/contents/db/catalog-state.json",
  encryptedCloudKey: "55595f675c596d091735061c0c2e02246c26241e17417452735751183b071b1c0f285b3120351f25"
};

// Régua completa de tamanhos do RN ao 18
const ALL_SIZES = [
  "RN", "P", "M", "G",
  "1", "2", "3",
  "4", "6", "8", "10",
  "12", "14", "16", "18"
];

// Mapeamento de Faixas Etárias
const AGE_GROUPS = [
  { id: "todos", label: "Todas as Idades (RN ao 18)", shortLabel: "RN ao 18", sizes: ALL_SIZES },
  { id: "bebe", label: "Bebê (RN, P, M, G)", shortLabel: "RN ao G", sizes: ["RN", "P", "M", "G"] },
  { id: "1-a-3", label: "Primeiros Passos (1 ao 3)", shortLabel: "1 ao 3", sizes: ["1", "2", "3"] },
  { id: "4-a-10", label: "Infantil (4 ao 10)", shortLabel: "4 ao 10", sizes: ["4", "6", "8", "10"] },
  { id: "juvenil", label: "Juvenil (12 ao 18)", shortLabel: "12 ao 16", sizes: ["12", "14", "16", "18"] }
];

// Categorias de Roupa da Loja
const CLOTHING_CATEGORIES = [
  "Conjuntos",
  "Vestidos",
  "Body",
  "Pijamas",
  "Blusas",
  "Calças"
];

// Slides do Carrossel Principal (Hero Section) com Fotos Reais da Loja
const HERO_SLIDES = [
  {
    id: 1,
    badge: "NOVA COLEÇÃO HAPPY KIDS • DO RN AO 16",
    title: "Looks encantadores, confortáveis e cheios de estilo para cada fase!",
    subtitle: "Confira nosso catálogo oficial atualizado com conjuntos, vestidos, linha bebê em suedine e pijamas. Enviamos de Santa Fé do Sul - SP para todo o Brasil em até 10x sem juros!",
    ctaPrimary: "Ver Catálogo Completo",
    ctaSecondary: "Chamar no WhatsApp",
    filterPreset: { gender: "todos", ageGroup: "todos", category: "todos" },
    bgClass: "from-[#FFF5EC] via-[#FFF9F2] to-[#EBF4FF]",
    accentColor: "#F38230",
    image: "assets/produtos/prod-002.jpg",
    floatingTag: "Catálogo Oficial da Loja",
    floatingPrice: "Peças a partir de R$ 39,90"
  },
  {
    id: 2,
    badge: "MUNDO BEBÊ • TAMANHOS RN AO G",
    title: "Maciez em Suedine e Ribana Canelada para o seu bebê",
    subtitle: "Conjuntinhos bordados, bodies vestido, macacões e kits com faixinha de cabelo pensados para proteger a pele delicada do bebê.",
    ctaPrimary: "Explorar Linha Bebê",
    ctaSecondary: "Ver Bodies & Macacões",
    filterPreset: { gender: "todos", ageGroup: "bebe", category: "todos" },
    bgClass: "from-[#EBF4FF] via-[#F5FAFF] to-[#FDF0F6]",
    accentColor: "#2B6EB5",
    image: "assets/produtos/prod-018.jpg",
    floatingTag: "Do RN ao G",
    floatingPrice: "Parcelamento em 10x Sem Juros"
  },
  {
    id: 3,
    badge: "INFANTIL & JUVENIL • DO 1 AO 16",
    title: "Conjuntos, Vestidos e Pijamas que as crianças amam vestir!",
    subtitle: "Estampas em alto relevo, glitter, bordados interativos e pijamas que brilham no escuro. Garanta já pelo site ou direto no WhatsApp!",
    ctaPrimary: "Conferir Moda Juvenil",
    ctaSecondary: "Ver Conjuntos",
    filterPreset: { gender: "todos", ageGroup: "juvenil", category: "todos" },
    bgClass: "from-[#FDF0F6] via-[#FFF8FA] to-[#FEFBEA]",
    accentColor: "#E84C93",
    image: "assets/produtos/prod-001.jpg",
    floatingTag: "Tamanhos até o 16",
    floatingPrice: "5% OFF no PIX ou 10x s/ juros"
  }
];

// Catálogo Real da Loja (99 Produtos Extraídos das Fotos Oficiais da Happy Kids)
const RAW_REAL_PRODUCTS = [
  { file: "prod-001.jpg", cod: "21889", name: "Conjunto Feminino Blusa Box Meia Malha & Short Saia Moletinho (Preto Be Love)", price: 112.90, gender: "Feminino", category: "Conjuntos", tam: "12 ao 16", badge: "Estampa Alto Relevo", featured: true, fabric: "Blusa Box em Meia Malha e Short Saia em Moletinho com estampa em alto relevo." },
  { file: "prod-002.jpg", cod: "21823", name: "Vestido Malha Favinho - Ursinha Confeiteira", price: 82.90, gender: "Feminino", category: "Vestidos", tam: "4 ao 10", badge: "Malha Favinho", featured: true, fabric: "Malha Favinho texturizada macia e confortável." },
  { file: "prod-003.jpg", cod: "21823", name: "Vestido Malha Favinho - Pandinha Jardineira", price: 82.90, gender: "Feminino", category: "Vestidos", tam: "4 ao 10", badge: "Malha Favinho", featured: false, fabric: "Malha Favinho texturizada macia e confortável." },
  { file: "prod-004.jpg", cod: "21824", name: "Conjunto Feminino Blusa Meia Malha & Short Moletinho - Veterinária", price: 69.90, gender: "Feminino", category: "Conjuntos", tam: "1 ao 3", badge: "Estampa Fofa", featured: true, fabric: "Blusa em Meia Malha 100% Algodão e Short em Moletinho estampado." },
  { file: "prod-005.jpg", cod: "21823", name: "Vestido Malha Favinho - Cachorrinha Veterinária (Rosa)", price: 82.90, gender: "Feminino", category: "Vestidos", tam: "4 ao 10", badge: "Malha Favinho", featured: false, fabric: "Malha Favinho texturizada macia e confortável." },
  { file: "prod-006.jpg", cod: "21824", name: "Conjunto Feminino Blusa Meia Malha & Short Moletinho - Pandinha Bióloga", price: 69.90, gender: "Feminino", category: "Conjuntos", tam: "1 ao 3", badge: "Tam. 1 ao 3", featured: false, fabric: "Blusa em Meia Malha e Short em Moletinho estampado." },
  { file: "prod-007.jpg", cod: "21825", name: "Conjunto Feminino Blusa Meia Malha & Short Moletinho - Veterinária", price: 79.90, gender: "Feminino", category: "Conjuntos", tam: "4 ao 10", badge: "Tam. 4 ao 10", featured: false, fabric: "Blusa em Meia Malha e Short em Moletinho estampado." },
  { file: "prod-008.jpg", cod: "21825", name: "Conjunto Feminino Blusa Meia Malha & Short Moletinho - Ursinha Confeiteira", price: 79.90, gender: "Feminino", category: "Conjuntos", tam: "4 ao 10", badge: "Tam. 4 ao 10", featured: false, fabric: "Blusa em Meia Malha e Short em Moletinho estampado." },
  { file: "prod-009.jpg", cod: "21824", name: "Conjunto Feminino Blusa Meia Malha & Short Moletinho - Ursinha Confeiteira", price: 69.90, gender: "Feminino", category: "Conjuntos", tam: "1 ao 3", badge: "Tam. 1 ao 3", featured: false, fabric: "Blusa em Meia Malha e Short em Moletinho estampado." },
  { file: "prod-010.jpg", cod: "21826", name: "Conjunto Feminino Juvenil Blusa e Short em Cotton c/ Aplique Flor (Bege)", price: 109.90, gender: "Feminino", category: "Conjuntos", tam: "12 ao 16", badge: "Com Aplique", featured: true, fabric: "Blusa e Short confeccionados em Cotton macio com aplique floral." },
  { file: "prod-011.jpg", cod: "21826", name: "Conjunto Feminino Juvenil Blusa e Short em Cotton c/ Aplique Flor (Rosa)", price: 109.90, gender: "Feminino", category: "Conjuntos", tam: "12 ao 16", badge: "Com Aplique", featured: false, fabric: "Blusa e Short confeccionados em Cotton macio com aplique floral." },
  { file: "prod-012.jpg", cod: "21825", name: "Conjunto Feminino Blusa Meia Malha & Short Moletinho - Pandinha Bióloga", price: 79.90, gender: "Feminino", category: "Conjuntos", tam: "4 ao 10", badge: "Tam. 4 ao 10", featured: false, fabric: "Blusa em Meia Malha e Short em Moletinho estampado." },
  { file: "prod-013.jpg", cod: "21828", name: "Macacão Bebê em Suedine Feminino Estampa em Relevo (Off-White)", price: 69.90, gender: "Feminino", category: "Body", tam: "P ao G", badge: "Estampa em Relevo", featured: false, fabric: "Suedine 100% Algodão macio com estampa floral em relevo." },
  { file: "prod-014.jpg", cod: "21828", name: "Macacão Bebê em Suedine Feminino Estampa em Relevo (Rosa)", price: 69.90, gender: "Feminino", category: "Body", tam: "P ao G", badge: "Estampa em Relevo", featured: false, fabric: "Suedine 100% Algodão macio com estampa floral em relevo." },
  { file: "prod-015.jpg", cod: "21827", name: "Conjunto Feminino Blusa Meia Malha Gatinha & Short Moletinho c/ Laços", price: 106.90, gender: "Feminino", category: "Conjuntos", tam: "4 ao 10", badge: "Super Charmoso", featured: true, fabric: "Blusa em Meia Malha e Short em Moletinho com detalhe de lacinhos laterais." },
  { file: "prod-016.jpg", cod: "21830", name: "Conjunto Masculino Regata Meia Malha & Bermuda Moletinho (Verde/Chumbo)", price: 64.90, gender: "Masculino", category: "Conjuntos", tam: "4 ao 10", badge: "Tam. 4 ao 10", featured: true, fabric: "Regata em Meia Malha mescla e Bermuda em Moletinho." },
  { file: "prod-017.jpg", cod: "21831", name: "Conjunto Bebê Body Manga Longa, Calça Saruel e Faixa em Ribana (Vermelho)", price: 82.90, gender: "Feminino", category: "Body", tam: "P ao G", badge: "Acompanha Faixa", featured: true, fabric: "Ribana Canelada macia com bordado e faixa de cabelo inclusa." },
  { file: "prod-018.jpg", cod: "21832", name: "Conjunto Bebê Masculino Body Gola Portuguesa Marinheiro & Short Suedine", price: 69.90, gender: "Masculino", category: "Body", tam: "RN ao G", badge: "Bordado Marinheiro", featured: true, fabric: "Suedine 100% Algodão com bordado, botões na gola e botões de pressão." },
  { file: "prod-019.jpg", cod: "21829", name: "Conjunto Masculino Regata Meia Malha & Bermuda Moletinho (Verde/Chumbo)", price: 54.90, gender: "Masculino", category: "Conjuntos", tam: "1 ao 3", badge: "Tam. 1 ao 3", featured: false, fabric: "Regata em Meia Malha mescla e Bermuda em Moletinho." },
  { file: "prod-020.jpg", cod: "21831", name: "Conjunto Bebê Feminino Body, Short e Faixa de Cabelo em Ribana (Rosa Claro)", price: 82.90, gender: "Feminino", category: "Body", tam: "P ao G", badge: "Acompanha Faixa", featured: false, fabric: "Ribana Canelada com etiqueta termocolante e faixa de cabelo." },
  { file: "prod-021.jpg", cod: "21831", name: "Conjunto Bebê Feminino Body, Short e Faixa de Cabelo em Ribana (Vermelho)", price: 82.90, gender: "Feminino", category: "Body", tam: "P ao G", badge: "Acompanha Faixa", featured: false, fabric: "Ribana Canelada com etiqueta termocolante e faixa de cabelo." },
  { file: "prod-022.jpg", cod: "21835", name: "Conjunto Bebê Masculino Body e Short em Suedine Bordado Ovelhinha (Marinho)", price: 62.90, gender: "Masculino", category: "Body", tam: "RN ao G", badge: "Bordado", featured: false, fabric: "Suedine macio hipoalergênico com bordado e abertura com botão de pressão." },
  { file: "prod-023.jpg", cod: "21833", name: "Macacão Regata Bebê Masculino em Suedine Girafinhas c/ Peitilho Botões", price: 59.90, gender: "Masculino", category: "Body", tam: "P ao G", badge: "Peitilho c/ Botões", featured: false, fabric: "Suedine 100% Algodão estampado com peitilho e botões." },
  { file: "prod-024.jpg", cod: "21837", name: "Conjunto Bebê Masculino Body e Short em Suedine Bordado Leãozinho (Bege)", price: 62.90, gender: "Masculino", category: "Body", tam: "RN ao G", badge: "Bordado", featured: false, fabric: "Suedine macio com bordado de leãozinho e botões de pressão." },
  { file: "prod-025.jpg", cod: "21838", name: "Conjunto Bebê Masculino Body Polo Branco & Short Suedine Marinho", price: 74.90, gender: "Masculino", category: "Body", tam: "RN ao G", badge: "Body Gola Polo", featured: false, fabric: "Suedine com peitilho de botões e aplique termocolante." },
  { file: "prod-026.jpg", cod: "21839", name: "Conjunto Bebê Feminino Body Listrado, Short e Faixa de Cabeça em Suedine", price: 74.90, gender: "Feminino", category: "Body", tam: "RN ao G", badge: "Com Faixa e Bordado", featured: false, fabric: "Suedine macio com bordado de borboleta e faixa de cabeça." },
  { file: "prod-027.jpg", cod: "21836", name: "Conjunto Bebê Feminino Body e Short em Suedine Bordado Ovelhinha (Rosa)", price: 62.90, gender: "Feminino", category: "Body", tam: "RN ao G", badge: "Bordado", featured: false, fabric: "Suedine macio com bordado delicado e botões de pressão." },
  { file: "prod-028.jpg", cod: "21840", name: "Body Vestido Bebê em Suedine c/ Bordado Floral (Vermelho)", price: 69.90, gender: "Feminino", category: "Body", tam: "P ao G", badge: "Body Vestido", featured: false, fabric: "Suedine 100% Algodão com bordado floral no peito." },
  { file: "prod-029.jpg", cod: "21841", name: "Conjunto Bebê Unissex Body e Calça em Suedine Bordado Ovelhinhas (Off-White)", price: 72.90, gender: "Unissex", category: "Body", tam: "P ao G", badge: "Unissex Bordado", featured: false, fabric: "Suedine 100% Algodão com bordado de ovelhinhas e botões de pressão." },
  { file: "prod-030.jpg", cod: "21842", name: "Macacão Regata Bebê Masculino em Suedine Girafinhas c/ Zíper Protetor", price: 69.90, gender: "Masculino", category: "Body", tam: "RN ao G", badge: "Zíper c/ Protetor", featured: false, fabric: "Suedine estampado com fechamento prático em zíper com protetor." },
  { file: "prod-031.jpg", cod: "21840", name: "Body Vestido Bebê em Suedine c/ Bordado Floral (Rosa)", price: 69.90, gender: "Feminino", category: "Body", tam: "P ao G", badge: "Body Vestido", featured: false, fabric: "Suedine 100% Algodão com bordado floral no peito." },
  { file: "prod-032.jpg", cod: "21844", name: "Macacão Bebê Gola Polo Unissex em Suedine c/ Aplique Girafinha (Amarelo)", price: 69.90, gender: "Unissex", category: "Body", tam: "P ao G", badge: "Gola Polo Unissex", featured: false, fabric: "Suedine com gola polo, botões frontais, aplique e botão de pressão." },
  { file: "prod-033.jpg", cod: "21844", name: "Macacão Bebê Gola Polo Masculino em Suedine c/ Aplique Girafinha (Azul Claro)", price: 69.90, gender: "Masculino", category: "Body", tam: "P ao G", badge: "Gola Polo", featured: false, fabric: "Suedine com gola polo, botões frontais, aplique e botão de pressão." },
  { file: "prod-034.jpg", cod: "21844", name: "Macacão Bebê Gola Polo em Suedine c/ Aplique Girafinha (Azul Marinho)", price: 69.90, gender: "Unissex", category: "Body", tam: "P ao G", badge: "Gola Polo", featured: false, fabric: "Suedine com gola polo, botões frontais, aplique e botão de pressão." },
  { file: "prod-035.jpg", cod: "21843", name: "Conjunto Bebê Feminino Body e Short Estampado Ursinhas em Suedine", price: 74.90, gender: "Feminino", category: "Body", tam: "RN ao G", badge: "Suedine Macio", featured: false, fabric: "Body com manguinha de babado e Short em Suedine estampado." },
  { file: "prod-036.jpg", cod: "21845", name: "Body Vestido Bebê Gola Polo c/ Renda em Suedine (Off-White)", price: 84.90, gender: "Feminino", category: "Body", tam: "P ao G", badge: "Gola c/ Renda", featured: true, fabric: "Suedine Premium com gola polo rendada, abertura com botões e etiqueta." },
  { file: "prod-037.jpg", cod: "21845", name: "Body Vestido Bebê Gola Polo c/ Renda em Suedine (Rosa Claro)", price: 84.90, gender: "Feminino", category: "Body", tam: "P ao G", badge: "Gola c/ Renda", featured: false, fabric: "Suedine Premium com gola polo rendada, abertura com botões e etiqueta." },
  { file: "prod-038.jpg", cod: "21846", name: "Body Bebê Unissex em Suedine 'Xodó da Família' (Branco)", price: 39.90, gender: "Unissex", category: "Body", tam: "P", badge: "Xodó da Família", featured: false, fabric: "Suedine 100% Algodão macio e antialérgico." },
  { file: "prod-039.jpg", cod: "21845", name: "Body Vestido Bebê Gola Polo c/ Renda em Suedine (Bege)", price: 84.90, gender: "Feminino", category: "Body", tam: "P ao G", badge: "Gola c/ Renda", featured: false, fabric: "Suedine Premium com gola polo rendada, abertura com botões e etiqueta." },
  { file: "prod-040.jpg", cod: "21847", name: "Conjunto Bebê Feminino Body e Short em Ribana Canelada (Rosa Claro)", price: 62.90, gender: "Feminino", category: "Body", tam: "RN ao G", badge: "Ribana Canelada", featured: false, fabric: "Ribana Canelada com etiqueta termocolante de ovelhinha e botões de pressão." },
  { file: "prod-041.jpg", cod: "21848", name: "Vestido Bebê em Cotton c/ Bordado Borboleta (Verde Menta)", price: 59.90, gender: "Feminino", category: "Vestidos", tam: "P ao G", badge: "Bordado Delicado", featured: false, fabric: "Cotton macio com manguinhas de babado e bordado no peito." },
  { file: "prod-042.jpg", cod: "21849", name: "Vestido Bebê e Tapa-Fralda Meia Malha Estampa Corações Coloridos", price: 69.90, gender: "Feminino", category: "Vestidos", tam: "P ao G", badge: "Com Tapa-Fralda", featured: false, fabric: "Meia Malha fresca e macia acompanhada de tapa-fralda combinando." },
  { file: "prod-043.jpg", cod: "21847", name: "Conjunto Bebê Unissex Body e Short em Ribana Canelada (Caramelo)", price: 62.90, gender: "Unissex", category: "Body", tam: "RN ao G", badge: "Ribana Canelada", featured: false, fabric: "Ribana Canelada com etiqueta termocolante de ovelhinha e botões de pressão." },
  { file: "prod-044.jpg", cod: "21850", name: "Conjunto Bebê Body em Cotton Bordado & Short Saia Moletinho (Verde/Bege)", price: 92.90, gender: "Feminino", category: "Conjuntos", tam: "P ao G", badge: "Bordado Floral", featured: false, fabric: "Body em Cotton bordado com botão de pressão e Short Saia em Moletinho." },
  { file: "prod-045.jpg", cod: "21851", name: "Conjunto Bebê Feminino Blusa, Short e Faixa de Cabelo Margaridas", price: 84.90, gender: "Feminino", category: "Conjuntos", tam: "P ao G", badge: "Acompanha Faixa", featured: false, fabric: "Conjunto 3 peças (Blusa, Short e Faixa de Cabelo) com estampa floral." },
  { file: "prod-046.jpg", cod: "21850", name: "Conjunto Bebê Body em Cotton Bordado & Short Saia Moletinho (Rosê/Caramelo)", price: 92.90, gender: "Feminino", category: "Conjuntos", tam: "P ao G", badge: "Bordado Floral", featured: false, fabric: "Body em Cotton bordado com botão de pressão e Short Saia em Moletinho." },
  { file: "prod-047.jpg", cod: "21853", name: "Conjunto Bebê Feminino Body Cotton Bordado & Saia Malha Trabalhada", price: 76.90, gender: "Feminino", category: "Conjuntos", tam: "P ao G", badge: "Bordado Baby Flower", featured: false, fabric: "Body em Cotton com bordado e Saia em Malha Trabalhada estampada." },
  { file: "prod-048.jpg", cod: "21854", name: "Conjunto Bebê Masculino Camiseta Meia Malha Girafa & Bermuda Moletinho Safari", price: 59.90, gender: "Masculino", category: "Conjuntos", tam: "M ao G", badge: "Tema Safari", featured: false, fabric: "Camiseta em Meia Malha e Bermuda em Moletinho estampado." },
  { file: "prod-049.jpg", cod: "21855", name: "Conjunto Bebê Masculino Body em Cotton & Jardineira Moletinho Safari", price: 106.90, gender: "Masculino", category: "Conjuntos", tam: "P ao G", badge: "Com Jardineira", featured: true, fabric: "Body em Cotton liso e Jardineira em Moletinho estampado com botões." },
  { file: "prod-050.jpg", cod: "21852", name: "Conjunto Bebê Feminino Blusa e Short em Ribana Canelada (Rosa Claro)", price: 69.90, gender: "Feminino", category: "Conjuntos", tam: "P ao G", badge: "Ribana Canelada", featured: false, fabric: "Ribana Canelada macia com babadinhos nas mangas e na cintura." },
  { file: "prod-051.jpg", cod: "21857", name: "Macacão Infantil Feminino Meia Malha Estampa Corações Coloridos", price: 49.90, gender: "Feminino", category: "Body", tam: "1 ao 3", badge: "Fresquinho", featured: false, fabric: "Meia Malha leve com alcinhas e amarração na cintura." },
  { file: "prod-052.jpg", cod: "21865", name: "Vestido Infantil Malha Honey Estampa Margaridas Coloridas", price: 82.90, gender: "Feminino", category: "Vestidos", tam: "1 ao 3", badge: "Malha Honey", featured: false, fabric: "Malha Honey texturizada super confortável e estilosa." },
  { file: "prod-053.jpg", cod: "21856", name: "Conjunto Bebê Masculino Regata Meia Malha Girafa & Bermuda Tactel Safari", price: 59.90, gender: "Masculino", category: "Conjuntos", tam: "P ao G", badge: "Bermuda Tactel", featured: false, fabric: "Regata em Meia Malha e Bermuda leve em Tactel estampado." },
  { file: "prod-054.jpg", cod: "21867", name: "Conjunto Masculino Camiseta Meia Malha Escavadeira & Bermuda Cargo Moletinho", price: 72.90, gender: "Masculino", category: "Conjuntos", tam: "1 ao 3", badge: "Estampa Alto Relevo", featured: false, fabric: "Camiseta em Meia Malha com estampa em alto relevo e Bermuda Cargo em Moletinho." },
  { file: "prod-055.jpg", cod: "21868", name: "Conjunto Masculino Camiseta Bordado Interativo Cachorrinho & Bermuda Cargo", price: 94.90, gender: "Masculino", category: "Conjuntos", tam: "1 ao 3", badge: "Bordado Interativo", featured: true, fabric: "Camiseta em Meia Malha com bordado interativo/aplique e Bermuda Bolso Cargo Moletinho." },
  { file: "prod-056.jpg", cod: "21869", name: "Conjunto Masculino Camiseta Meia Malha & Bermuda Moletinho Safari (Branco/Azul)", price: 69.90, gender: "Masculino", category: "Conjuntos", tam: "1 ao 3", badge: "Funny Safari", featured: false, fabric: "Camiseta em Meia Malha e Bermuda em Moletinho estampado." },
  { file: "prod-057.jpg", cod: "21869", name: "Conjunto Masculino Camiseta Meia Malha & Bermuda Moletinho Safari (Verde/Bege)", price: 69.90, gender: "Masculino", category: "Conjuntos", tam: "1 ao 3", badge: "Funny Safari", featured: false, fabric: "Camiseta em Meia Malha e Bermuda em Moletinho estampado." },
  { file: "prod-058.jpg", cod: "21866", name: "Conjunto Feminino Blusa Meia Malha Time to Relax & Short Moletinho (Rosa)", price: 69.90, gender: "Feminino", category: "Conjuntos", tam: "1 ao 3", badge: "Alto Relevo e Glitter", featured: false, fabric: "Blusa em Meia Malha com alto relevo e glitter e Short em Moletinho." },
  { file: "prod-059.jpg", cod: "21871", name: "Conjunto Masculino Camiseta Dinossauros c/ Bordado & Bermuda Cargo Moletinho", price: 84.90, gender: "Masculino", category: "Conjuntos", tam: "1 ao 3", badge: "Estampa c/ Bordado", featured: false, fabric: "Camiseta em Meia Malha com estampa e bordado e Bermuda Cargo em Moletinho." },
  { file: "prod-060.jpg", cod: "21872", name: "Pijama Juvenil Masculino Malha Microfibra Estampada - Dinossauros Roo Arr!", price: 104.90, gender: "Masculino", category: "Pijamas", tam: "12 ao 16", badge: "Malha Microfibra", featured: false, fabric: "Malha Microfibra Estampada ultra macia e fresquinha." },
  { file: "prod-061.jpg", cod: "21870", name: "Conjunto Masculino Regata Meia Malha Leãozinho & Bermuda Tactel Safari", price: 62.90, gender: "Masculino", category: "Conjuntos", tam: "1 ao 3", badge: "Bermuda Tactel", featured: false, fabric: "Regata em Meia Malha com estampa e Bermuda em Tactel estampado." },
  { file: "prod-062.jpg", cod: "21872", name: "Pijama Juvenil Masculino Malha Microfibra Estampada - Futebol (Azul)", price: 104.90, gender: "Masculino", category: "Pijamas", tam: "12 ao 16", badge: "Malha Microfibra", featured: false, fabric: "Malha Microfibra Estampada ultra macia e fresquinha." },
  { file: "prod-063.jpg", cod: "21873", name: "Pijama Infantil Masculino Malha Microfibra Estampada - Dinossauros Roo Arr!", price: 62.90, gender: "Masculino", category: "Pijamas", tam: "1 ao 3", badge: "Tam. 1 ao 3", featured: false, fabric: "Malha Microfibra Estampada ultra macia e confortável." },
  { file: "prod-064.jpg", cod: "21873", name: "Pijama Infantil Masculino Malha Microfibra Estampada - Capivara Astronauta", price: 62.90, gender: "Masculino", category: "Pijamas", tam: "1 ao 3", badge: "Capivara Espacial", featured: false, fabric: "Malha Microfibra Estampada ultra macia e confortável." },
  { file: "prod-065.jpg", cod: "21874", name: "Pijama Infantil Masculino Malha Microfibra Estampada - Capivara Astronauta", price: 89.90, gender: "Masculino", category: "Pijamas", tam: "4 ao 10", badge: "Capivara Espacial", featured: true, fabric: "Malha Microfibra Estampada ultra macia e confortável." },
  { file: "prod-066.jpg", cod: "21874", name: "Pijama Infantil Masculino Malha Microfibra Estampada - Dinossauros Roo Arr!", price: 89.90, gender: "Masculino", category: "Pijamas", tam: "4 ao 10", badge: "Tam. 4 ao 10", featured: false, fabric: "Malha Microfibra Estampada ultra macia e confortável." },
  { file: "prod-067.jpg", cod: "21874", name: "Pijama Infantil Masculino Malha Microfibra Estampada - Futebol (Azul)", price: 89.90, gender: "Masculino", category: "Pijamas", tam: "4 ao 10", badge: "Tam. 4 ao 10", featured: false, fabric: "Malha Microfibra Estampada ultra macia e confortável." },
  { file: "prod-068.jpg", cod: "21873", name: "Pijama Infantil Masculino Malha Microfibra Estampada - Futebol (Azul)", price: 62.90, gender: "Masculino", category: "Pijamas", tam: "1 ao 3", badge: "Tam. 1 ao 3", featured: false, fabric: "Malha Microfibra Estampada ultra macia e confortável." },
  { file: "prod-069.jpg", cod: "21875", name: "Pijama Juvenil Feminino Malha Microfibra Estampada - Sorvetinhos Ursinho (Azul)", price: 96.90, gender: "Feminino", category: "Pijamas", tam: "12 ao 16", badge: "Malha Microfibra", featured: false, fabric: "Malha Microfibra Estampada com toque geladinho e macio." },
  { file: "prod-070.jpg", cod: "21875", name: "Pijama Juvenil Feminino Malha Microfibra Estampada - Ursinhos Bons Sonhos zZz", price: 96.90, gender: "Feminino", category: "Pijamas", tam: "12 ao 16", badge: "Malha Microfibra", featured: false, fabric: "Malha Microfibra Estampada com toque geladinho e macio." },
  { file: "prod-071.jpg", cod: "21874", name: "Pijama Infantil Feminino Malha Microfibra Estampada - Magical Panda (Rosa)", price: 89.90, gender: "Feminino", category: "Pijamas", tam: "4 ao 10", badge: "Tam. 4 ao 10", featured: false, fabric: "Malha Microfibra Estampada com toque macio." },
  { file: "prod-072.jpg", cod: "21875", name: "Pijama Juvenil Feminino Malha Microfibra Estampada - Magical Panda (Rosa)", price: 96.90, gender: "Feminino", category: "Pijamas", tam: "12 ao 16", badge: "Tam. 12 ao 16", featured: false, fabric: "Malha Microfibra Estampada com toque macio." },
  { file: "prod-073.jpg", cod: "21877", name: "Pijama Infantil Feminino Malha Microfibra Estampada - Magical Panda (Rosa)", price: 59.90, gender: "Feminino", category: "Pijamas", tam: "1 ao 3", badge: "Tam. 1 ao 3", featured: false, fabric: "Malha Microfibra Estampada com toque macio." },
  { file: "prod-074.jpg", cod: "21877", name: "Pijama Infantil Feminino Malha Microfibra Estampada - Ursinhos Bons Sonhos zZz", price: 59.90, gender: "Feminino", category: "Pijamas", tam: "1 ao 3", badge: "Tam. 1 ao 3", featured: false, fabric: "Malha Microfibra Estampada com toque macio." },
  { file: "prod-075.jpg", cod: "21876", name: "Pijama Infantil Feminino Malha Microfibra Estampada - Ursinhos Bons Sonhos zZz", price: 76.90, gender: "Feminino", category: "Pijamas", tam: "4 ao 10", badge: "Tam. 4 ao 10", featured: false, fabric: "Malha Microfibra Estampada com toque macio." },
  { file: "prod-076.jpg", cod: "21878", name: "Pijama Feminino Meia Malha Estampa Pandas Brilha no Escuro (Rosa Coral)", price: 69.90, gender: "Feminino", category: "Pijamas", tam: "10", badge: "Brilha no Escuro", featured: true, fabric: "Meia Malha 100% Algodão com estampa especial que brilha no escuro." },
  { file: "prod-077.jpg", cod: "21879", name: "Blusa Juvenil Meia Malha Feminina Borboletas c/ Aplique Strass (Off-White)", price: 59.90, gender: "Feminino", category: "Blusas", tam: "12 ao 16", badge: "Aplique Strass", featured: false, fabric: "Meia Malha macia com manga princesa e estampa com aplique de strass." },
  { file: "prod-078.jpg", cod: "21880", name: "Blusa Juvenil em Ribana Canelada Feminina Básica (Preta)", price: 49.90, gender: "Feminino", category: "Blusas", tam: "12 ao 16", badge: "Ribana Canelada", featured: false, fabric: "Ribana Canelada com ótimo caimento e elasticidade." },
  { file: "prod-079.jpg", cod: "21878", name: "Pijama Feminino Meia Malha Estampa Pandas Brilha no Escuro (Branco/Pink)", price: 69.90, gender: "Feminino", category: "Pijamas", tam: "10", badge: "Brilha no Escuro", featured: false, fabric: "Meia Malha 100% Algodão com estampa especial que brilha no escuro." },
  { file: "prod-080.jpg", cod: "21881", name: "Blusa Juvenil Meia Malha Feminina College Fashion Capybara (Preta)", price: 49.90, gender: "Feminino", category: "Blusas", tam: "12 ao 16", badge: "Hit Capivara", featured: true, fabric: "Meia Malha 100% Algodão macia com estampa Fashion Capybara." },
  { file: "prod-081.jpg", cod: "21882", name: "Blusa Juvenil em Cotton Feminina Laços Alto Relevo c/ Glitter (Off-White)", price: 64.90, gender: "Feminino", category: "Blusas", tam: "12 ao 16", badge: "Alto Relevo c/ Glitter", featured: false, fabric: "Cotton macio com estampa de laços em alto relevo e glitter." },
  { file: "prod-082.jpg", cod: "21880", name: "Blusa Juvenil em Ribana Canelada Feminina Básica (Rosa Bebê)", price: 49.90, gender: "Feminino", category: "Blusas", tam: "12 ao 16", badge: "Ribana Canelada", featured: false, fabric: "Ribana Canelada com ótimo caimento e elasticidade." },
  { file: "prod-083.jpg", cod: "21883", name: "Conjunto Juvenil Feminino Blusa Meia Malha & Short Moletinho Color Your Life (Off-White/Marrom)", price: 112.90, gender: "Feminino", category: "Conjuntos", tam: "12 ao 16", badge: "Alto Relevo e Glitter", featured: false, fabric: "Blusa em Meia Malha com alto relevo e glitter e Short em Moletinho com bolso." },
  { file: "prod-084.jpg", cod: "21883", name: "Conjunto Juvenil Feminino Blusa Meia Malha & Short Moletinho Color Your Life (Verde/Preto)", price: 112.90, gender: "Feminino", category: "Conjuntos", tam: "12 ao 16", badge: "Alto Relevo e Glitter", featured: false, fabric: "Blusa em Meia Malha com alto relevo e glitter e Short em Moletinho com bolso." },
  { file: "prod-085.jpg", cod: "21882", name: "Blusa Juvenil em Cotton Feminina Laços Alto Relevo c/ Glitter (Preta)", price: 64.90, gender: "Feminino", category: "Blusas", tam: "12 ao 16", badge: "Alto Relevo c/ Glitter", featured: false, fabric: "Cotton macio com estampa de laços em alto relevo e glitter." },
  { file: "prod-086.jpg", cod: "21885", name: "Short Moletinho Feminino Infantil c/ Bolso e Etiqueta (Preto)", price: 46.90, gender: "Feminino", category: "Calças", tam: "4 ao 10", badge: "Com Bolso", featured: false, fabric: "Moletinho encorpado confortável com bolso frontal e etiqueta." },
  { file: "prod-087.jpg", cod: "21886", name: "Vestido Infantil em Ribana Canelada c/ Bordado Pedraria (Preto)", price: 84.90, gender: "Feminino", category: "Vestidos", tam: "4 ao 10", badge: "Bordado Pedraria", featured: true, fabric: "Ribana Canelada com acabamento sofisticado em bordado de pedraria na gola." },
  { file: "prod-088.jpg", cod: "21884", name: "Short Moletinho Feminino Juvenil c/ Bolso e Etiqueta (Preto)", price: 54.90, gender: "Feminino", category: "Calças", tam: "12 ao 16", badge: "Com Bolso", featured: false, fabric: "Moletinho encorpado confortável com bolso frontal e etiqueta." },
  { file: "prod-089.jpg", cod: "21888", name: "Conjunto Juvenil Feminino Blusa Meia Malha & Short Saia Moletinho c/ Fio de Lurex", price: 119.90, gender: "Feminino", category: "Conjuntos", tam: "12 ao 16", badge: "Fio de Lurex", featured: true, fabric: "Blusa em Meia Malha com alto relevo/glitter e Short Saia em Moletinho com Fio de Lurex e bolso." },
  { file: "prod-090.jpg", cod: "21858", name: "Conjunto Feminino Blusa em Cotton & Saia Jacquard c/ Short por Baixo (Off-White/Bege)", price: 104.90, gender: "Feminino", category: "Conjuntos", tam: "1 ao 3", badge: "Saia c/ Short Interno", featured: true, fabric: "Blusa em Cotton com relevo/glitter e Saia em Malha Jacquard com short em Cotton por baixo." },
  { file: "prod-091.jpg", cod: "21858", name: "Conjunto Feminino Blusa em Cotton & Saia Jacquard c/ Short por Baixo (Rosa)", price: 104.90, gender: "Feminino", category: "Conjuntos", tam: "1 ao 3", badge: "Saia c/ Short Interno", featured: false, fabric: "Blusa em Cotton com relevo/glitter e Saia em Malha Jacquard com short em Cotton por baixo." },
  { file: "prod-092.jpg", cod: "21887", name: "Vestido Juvenil em Ribana Canelada c/ Bordado Pedraria (Preto)", price: 102.90, gender: "Feminino", category: "Vestidos", tam: "12 ao 16", badge: "Bordado Pedraria", featured: false, fabric: "Ribana Canelada com acabamento sofisticado em bordado de pedraria na gola." },
  { file: "prod-093.jpg", cod: "21859", name: "Conjunto Feminino Blusa e Short em Malha Jacquard (Rosa Bebê)", price: 109.90, gender: "Feminino", category: "Conjuntos", tam: "1 ao 3", badge: "Malha Jacquard", featured: false, fabric: "Blusa com alça de babado e Short confeccionados em Malha Jacquard trabalhada." },
  { file: "prod-094.jpg", cod: "21860", name: "Conjunto Feminino Blusa em Cotton & Short Saia Moletinho c/ Fio de Lurex", price: 79.90, gender: "Feminino", category: "Conjuntos", tam: "1 ao 3", badge: "Fio de Lurex", featured: false, fabric: "Blusa em Cotton com estampa alto relevo/glitter e Short Saia Moletinho com fio de lurex." },
  { file: "prod-095.jpg", cod: "21859", name: "Conjunto Feminino Blusa e Short em Malha Jacquard (Bege)", price: 109.90, gender: "Feminino", category: "Conjuntos", tam: "1 ao 3", badge: "Malha Jacquard", featured: false, fabric: "Blusa com alça de babado e Short confeccionados em Malha Jacquard trabalhada." },
  { file: "prod-096.jpg", cod: "21862", name: "Conjunto Feminino Blusa Meia Malha My Butterfly & Short Saia Moletinho", price: 72.90, gender: "Feminino", category: "Conjuntos", tam: "1 ao 3", badge: "Short Saia", featured: false, fabric: "Blusa em Meia Malha estampada e Short Saia em Moletinho macio." },
  { file: "prod-097.jpg", cod: "21863", name: "Conjunto Feminino Blusa em Cotton Bordada & Short Malha Trabalhada Floral", price: 104.90, gender: "Feminino", category: "Conjuntos", tam: "1 ao 3", badge: "Bordado Borboleta", featured: false, fabric: "Blusa em Cotton com bordado delicado e Short em Malha Trabalhada estampada." },
  { file: "prod-098.jpg", cod: "21861", name: "Conjunto Feminino Blusa Meia Malha c/ Strass & Short Saia Moletinho", price: 79.90, gender: "Feminino", category: "Conjuntos", tam: "1 ao 3", badge: "Aplique Strass", featured: false, fabric: "Blusa em Meia Malha com aplique de strass e Short Saia pregueado em Moletinho." },
  { file: "prod-099.jpg", cod: "21864", name: "Conjunto Feminino Blusa Malha Honey Margaridas & Short Saia Moletinho", price: 94.90, gender: "Feminino", category: "Conjuntos", tam: "1 ao 3", badge: "Malha Honey", featured: false, fabric: "Blusa em Malha Honey estampada e Short Saia em Moletinho." }
];

// Função auxiliar que converte o texto de tamanho da imagem em array de tamanhos e grupo etário
function parseTamInfo(tamStr) {
  const map = {
    "P": { sizes: ["P"], ageGroup: "bebe", ageLabel: "Tam. P" },
    "P ao G": { sizes: ["P", "M", "G"], ageGroup: "bebe", ageLabel: "Tam. P ao G" },
    "RN ao G": { sizes: ["RN", "P", "M", "G"], ageGroup: "bebe", ageLabel: "Tam. RN ao G" },
    "M ao G": { sizes: ["M", "G"], ageGroup: "bebe", ageLabel: "Tam. M ao G" },
    "1 ao 3": { sizes: ["1", "2", "3"], ageGroup: "1-a-3", ageLabel: "Tam. 1 ao 3" },
    "4 ao 10": { sizes: ["4", "6", "8", "10"], ageGroup: "4-a-10", ageLabel: "Tam. 4 ao 10" },
    "10": { sizes: ["10"], ageGroup: "4-a-10", ageLabel: "Tam. 10" },
    "12 ao 16": { sizes: ["12", "14", "16"], ageGroup: "juvenil", ageLabel: "Tam. 12 ao 16" }
  };
  return map[tamStr] || { sizes: ["P", "M", "G"], ageGroup: "bebe", ageLabel: `Tam. ${tamStr}` };
}

// Constrói o catálogo oficial vinculando fotos de variações do mesmo CÓD. na galeria de imagens
const INITIAL_PRODUCTS = RAW_REAL_PRODUCTS.map((item, idx) => {
  const tamInfo = parseTamInfo(item.tam);
  const mainImagePath = `assets/produtos/${item.file}`;

  // Busca outras fotos que compartilham o mesmo CÓD. para exibir como opções na galeria do produto
  const siblingImages = RAW_REAL_PRODUCTS
    .filter((other) => other.cod === item.cod && other.file !== item.file)
    .map((other) => `assets/produtos/${other.file}`);

  return {
    id: `hk-real-${idx + 1}`,
    sku: `CÓD. ${item.cod}`,
    name: item.name,
    price: item.price,
    oldPrice: null,
    gender: item.gender,
    category: item.category,
    ageGroup: tamInfo.ageGroup,
    ageLabel: tamInfo.ageLabel,
    sizes: tamInfo.sizes,
    badge: item.badge,
    featured: item.featured,
    images: [mainImagePath, ...siblingImages],
    description: `${item.name} (${tamInfo.ageLabel} • CÓD. ${item.cod}). Peça original disponível na Happy Kids Moda Infantil em Santa Fé do Sul - SP, desenvolvida com modelagem confortável e excelente acabamento.`,
    fabric: item.fabric,
    washing: [
      "Lavar com cores similares e sabão neutro",
      "Não utilizar alvejantes à base de cloro",
      "Secar preferencialmente à sombra",
      "Passar pelo avesso em temperatura branda"
    ],
    createdAt: "2026-10-23"
  };
});
