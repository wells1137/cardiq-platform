export interface BoxProductIntelligence {
  id: string;
  manufacturer: "Panini" | "Topps" | "Upper Deck";
  productLine: string;
  season: string;
  format: string;
  description: string;
  whatToChase: string[];
  boxHits: string[];
  strengths: string[];
  risks: string[];
  buyRating: "HIGH" | "MEDIUM" | "LOW";
  audience: string;
  sourceTitle: string;
  sourceUrl: string;
  note: string;
  brandKeywords: string[];
  setKeywords: string[];
  strategy: string[];
}

export interface ManufacturerIntelligence {
  manufacturer: "Panini" | "Topps" | "Upper Deck";
  overview: string;
  positioning: string[];
  strengths: string[];
  watchouts: string[];
}

const manufacturers: ManufacturerIntelligence[] = [
  {
    manufacturer: "Panini",
    overview: "Panini 仍然是篮球卡核心厂商之一，品牌层级完整，覆盖入门到高端。",
    positioning: ["Prizm / Select / Mosaic 适合看流动性", "Court Kings / Noir 偏审美和中高端", "Donruss / Choice 适合追新秀和彩虹"],
    strengths: ["品牌矩阵成熟", "平行和编号体系完善", "二级市场流通性强"],
    watchouts: ["同球员同年产品较多，资金容易分散", "热门系列高峰期封蜡价波动大"],
  },
  {
    manufacturer: "Topps",
    overview: "Topps Chrome Basketball 回归后，Chrome 风格和折射系重新吸引大量关注。",
    positioning: ["Chrome Hobby 适合追 auto 与 SSP", "Sapphire 偏超高端展示和限量", "NBL / OTE 更偏题材与潜力"],
    strengths: ["Chrome 审美统一", "折射平行认可度高", "官方 checklist / odds 页面透明"],
    watchouts: ["新品初期价格波动大", "不同子系列定位差异明显，需要分辨主线和分支"],
  },
  {
    manufacturer: "Upper Deck",
    overview: "Upper Deck 篮球更多出现在数字/娱乐化产品形态和特殊授权场景中。",
    positioning: ["e-Pack 适合低摩擦尝试", "更偏数字体验、成就系统与交易生态"],
    strengths: ["数字化交互强", "适合轻量体验和社交交易", "不需要线下拆盒门槛"],
    watchouts: ["NBA 主线纸卡矩阵不如 Panini/Topps 完整", "更适合补充而非替代主流 Hobby 盒"],
  },
];

const products: BoxProductIntelligence[] = [
  {
    id: "panini-court-kings-2024-25",
    manufacturer: "Panini",
    productLine: "Court Kings Basketball Hobby",
    season: "2024-25",
    format: "Hobby Box",
    description: "偏艺术卡面和分层新秀设计的中高端篮球产品，适合喜欢审美和分级展示的玩家。",
    whatToChase: ["新秀分级卡", "签字卡", "高端插卡", "低编号平行"],
    boxHits: ["重点看新秀分层", "签字与低编号更决定长期价值", "不靠大量 base 获胜"],
    strengths: ["风格辨识度高", "优质新秀卡常有独立审美溢价", "适合收藏与中期持有"],
    risks: ["流动性不如 Prizm/Select 普适", "价格更依赖具体球员和画风偏好"],
    buyRating: "MEDIUM",
    audience: "喜欢审美卡面、偏中高端收藏的玩家",
    sourceTitle: "Panini America Box Wars 2025",
    sourceUrl: "https://blog.paniniamerica.net/paninis-always-exciting-box-wars-returns-to-the-national/",
    note: "依据 Panini 2025 NSCC Box Wars 日程可确认 2024-25 Court Kings Basketball Hobby 为其重点活动产品之一；具体箱配建议以正式产品页/清单为准。",
    brandKeywords: ["Panini"],
    setKeywords: ["Court Kings"],
    strategy: ["更适合挑画风和稀有新秀分层", "不建议把预算全压在 base，优先盯低编和签字", "适合作为收藏仓位，不是最高流动性的交易盒"],
  },
  {
    id: "panini-mosaic-2024-25",
    manufacturer: "Panini",
    productLine: "Mosaic Basketball Hobby",
    season: "2024-25",
    format: "Hobby Box",
    description: "视觉冲击强、插卡和折射丰富，适合追热点球员和短中线交易。",
    whatToChase: ["Genesis / case hit 类稀有卡", "Rookie parallels", "热门球星低编"],
    boxHits: ["彩色平行与 case hit 是核心", "新秀和超级球星决定溢价弹性"],
    strengths: ["图像风格强", "话题卡较多", "适合热点时期操作"],
    risks: ["不同稀有度价格分层大", "普通 base 与常见平行承接弱"],
    buyRating: "MEDIUM",
    audience: "喜欢追热点、追 case hit 的短中线玩家",
    sourceTitle: "Panini America Box Wars 2025",
    sourceUrl: "https://blog.paniniamerica.net/paninis-always-exciting-box-wars-returns-to-the-national/",
    note: "Panini 在 2025 Box Wars 中纳入 2024-25 Mosaic Hobby Basketball，说明其仍是活跃主线产品。",
    brandKeywords: ["Panini"],
    setKeywords: ["Mosaic"],
    strategy: ["适合追热门新秀和话题球星", "强插卡和稀有 case hit 决定上限", "更适合做热度交易，不适合只看 base"],
  },
  {
    id: "panini-select-2024-25",
    manufacturer: "Panini",
    productLine: "Select Basketball Hobby",
    season: "2024-25",
    format: "Hobby Box",
    description: "层级感强、分层 base 与彩平体系成熟，适合做球星同年多层级布局。",
    whatToChase: ["Concourse / Premier / Courtside 高层级新秀", "低编号 tie-dye / gold", "签字卡"],
    boxHits: ["层级 base + 平行体系", "高层级版本更容易拉开差价"],
    strengths: ["适合做同球员多层级比较", "高层级卡辨识度强", "流动性优于冷门系列"],
    risks: ["层级多导致新手判断成本高", "需要精准区分层级与平行"],
    buyRating: "HIGH",
    audience: "懂层级体系、愿意精挑版本的玩家",
    sourceTitle: "Panini America Box Wars 2025",
    sourceUrl: "https://blog.paniniamerica.net/paninis-always-exciting-box-wars-returns-to-the-national/",
    note: "Panini 2025 Box Wars 明确列出 2024-25 Select Basketball Hobby，属于值得持续跟踪的主线产品。",
    brandKeywords: ["Panini"],
    setKeywords: ["Select"],
    strategy: ["优先关注 Courtside / Premier 等高层级版本", "适合把同球星多层级卡做纵向比较", "如果预算有限，买盒不如直接买高层级单卡"],
  },
  {
    id: "topps-chrome-2024-25",
    manufacturer: "Topps",
    productLine: "Topps Chrome Basketball Hobby",
    season: "2024-25",
    format: "Hobby Box",
    description: "Topps Chrome Basketball 主线回归产品，折射体系、SSP 和 autograph 是价值核心。",
    whatToChase: ["2 autos per hobby box", "SSP case hits", "Radiating Rookies / Helix / Ultra Violet All-Stars", "热门新秀 refractors"],
    boxHits: ["每 Hobby 盒 2 张 autographs", "8 cards per pack / 12 packs per box", "200-card base set + 多种 SSP inserts"],
    strengths: ["官方 odds / checklist 透明", "Chrome 审美统一", "新秀与 SSP 题材兼具"],
    risks: ["新品高热度时溢价明显", "追 SSP 波动大"],
    buyRating: "HIGH",
    audience: "重视官方透明度、偏好 refractor 体系的玩家",
    sourceTitle: "Topps 2024/25 Chrome Basketball Hobby Box",
    sourceUrl: "https://www.topps.com/products/2024-25-topps-chrome-basketball-hobby-box-pre-order",
    note: "Topps 官方页面显示该产品有 2 autos per hobby box，并提供 checklist / odds 下载入口。",
    brandKeywords: ["Topps"],
    setKeywords: ["Chrome"],
    strategy: ["适合围绕折射平行和 SSP 做筛选", "首发期适合看热度，稳定期更适合挑单卡", "想追 hit 可以考虑买盒，想控风险建议买单卡"],
  },
  {
    id: "topps-chrome-sapphire-2025-26",
    manufacturer: "Topps",
    productLine: "Topps Chrome Basketball Sapphire",
    season: "2025-26",
    format: "Hobby Box",
    description: "Chrome 的超高端分支，强调稀缺、展示感和 Sapphire 专属视觉。",
    whatToChase: ["Sapphire-exclusive parallels", "Infinite Sapphire", "Sapphire Selections", "高端球星/新秀限量版本"],
    boxHits: ["更偏限量与展示性", "不是常规流动性取向，而是精品路线"],
    strengths: ["展示效果极强", "适合高净值玩家追顶级版本", "限量属性鲜明"],
    risks: ["封蜡价格高", "容错率低，需要对球员和时点更敏感"],
    buyRating: "LOW",
    audience: "高预算、偏展示型与精品路线的玩家",
    sourceTitle: "Topps Chrome Basketball Sapphire 2025-26",
    sourceUrl: "https://launches.topps.com/en-US/launch/2025-26-topps-chrome-basketball-sapphire-hobby-box",
    note: "Topps Launch 页面将 Sapphire 定位为更稀缺、更高级的 Chrome 演绎，价格也更高。",
    brandKeywords: ["Topps"],
    setKeywords: ["Sapphire"],
    strategy: ["更适合作为高端精品仓位", "不建议新手以拆盒方式入门", "买盒之前先确认自己追的是球员还是展示性版本"],
  },
  {
    id: "upper-deck-epack-basketball",
    manufacturer: "Upper Deck",
    productLine: "Upper Deck e-Pack Basketball",
    season: "Always On",
    format: "Digital / Pack Platform",
    description: "数字化开包与交易平台，适合作为低摩擦试水、补充娱乐性和成就系统。",
    whatToChase: ["平台专属 achievements", "数字合成与转实卡机会", "低门槛交易体验"],
    boxHits: ["更像平台生态而非单一纸盒产品", "适合轻体验和社交交易"],
    strengths: ["上手成本低", "交易和成就系统强", "适合日常轻量参与"],
    risks: ["不等同于传统 NBA 主线 Hobby 盒", "更偏平台体验而非纸卡主战场"],
    buyRating: "MEDIUM",
    audience: "想低成本试水、喜欢数字交互的玩家",
    sourceTitle: "Upper Deck e-Pack About",
    sourceUrl: "https://www.upperdeckepack.com/About",
    note: "Upper Deck e-Pack 官方 About 页强调篮球产品、交易、成就与 weekly releases 的数字化体验。",
    brandKeywords: ["Upper Deck"],
    setKeywords: ["e-Pack"],
    strategy: ["更适合轻量体验和社交交易", "不要和传统 Hobby 盒用同一逻辑比较", "适合作为补充参与方式而不是主仓位"],
  },
];

export function getBoxManufacturers() {
  return manufacturers;
}

export function getBoxProducts(manufacturer?: string) {
  return manufacturer && manufacturer !== "ALL"
    ? products.filter((item) => item.manufacturer === manufacturer)
    : products;
}

export function getBoxById(id: string) {
  return products.find((item) => item.id === id);
}

export function getBoxIntelligence(manufacturer?: string) {
  const filteredProducts = getBoxProducts(manufacturer);
  const grouped = manufacturers.map((item) => ({
    ...item,
    products: filteredProducts.filter((product) => product.manufacturer === item.manufacturer),
  })).filter((item) => item.products.length > 0 || !manufacturer || manufacturer === "ALL");

  const buyingGuide = [
    {
      title: "优先买主线高流动性盒",
      content: "如果目标是看行情和做交易，优先考虑 Prizm / Select / Topps Chrome 这种市场讨论度高、卡价层次清晰的产品。",
    },
    {
      title: "把预算分成盒子 + 单卡两部分",
      content: "热门盒子适合参与首发热度，但真正的长期回报通常来自挑中特定球星、系列和平行的单卡。",
    },
    {
      title: "先看 checklist / odds，再决定是不是追 hit",
      content: "高端盒和 Sapphire 这类产品容错率低，适合对球员与 checklist 有把握的玩家。",
    },
  ];

  return {
    manufacturers: grouped,
    products: filteredProducts,
    buyingGuide,
    updatedAt: new Date().toISOString(),
  };
}
