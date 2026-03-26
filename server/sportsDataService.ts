/**
 * Sports Data Service
 * 整合 BallDontLie API 获取球员数据，并生成模拟球星卡市价数据
 */

import axios from "axios";
import { upsertPlayer, upsertCard, insertPriceHistory, getPlayerByExternalId } from "./db";

const BALLDONTLIE_BASE = "https://api.balldontlie.io/v1";
const BALLDONTLIE_KEY = process.env.BALLDONTLIE_API_KEY || "";

const bdlClient = axios.create({
  baseURL: BALLDONTLIE_BASE,
  headers: BALLDONTLIE_KEY ? { Authorization: BALLDONTLIE_KEY } : {},
  timeout: 10000,
});

// ─── BallDontLie API ─────────────────────────────────────────────────────────

export interface BDLPlayer {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  height: string;
  weight: string;
  jersey_number: string;
  college: string;
  country: string;
  draft_year: number;
  draft_round: number;
  draft_number: number;
  team: {
    id: number;
    conference: string;
    division: string;
    city: string;
    name: string;
    full_name: string;
    abbreviation: string;
  };
}

export interface BDLGameStats {
  id: number;
  min: string;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  pf: number;
  pts: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
  player: { id: number; first_name: string; last_name: string };
  game: { id: number; date: string; home_team_score: number; visitor_team_score: number };
}

export async function fetchNBAPlayers(search: string): Promise<BDLPlayer[]> {
  try {
    const res = await bdlClient.get("/players", {
      params: { search, per_page: 10 },
    });
    return res.data.data || [];
  } catch (err) {
    console.error("[BDL] fetchNBAPlayers error:", err);
    return [];
  }
}

export async function fetchPlayerStats(playerId: number, season = 2024): Promise<BDLGameStats[]> {
  try {
    const res = await bdlClient.get("/stats", {
      params: { player_ids: [playerId], seasons: [season], per_page: 15 },
    });
    return res.data.data || [];
  } catch (err) {
    console.error("[BDL] fetchPlayerStats error:", err);
    return [];
  }
}

// ─── 球员表现评分算法 ─────────────────────────────────────────────────────────

export function calculatePerformanceScore(stats: BDLGameStats[]): {
  score: number;
  summary: Record<string, number>;
} {
  if (stats.length === 0) return { score: 50, summary: {} };

  const recent = stats.slice(-10); // 最近10场
  const avg = (key: keyof BDLGameStats) =>
    recent.reduce((sum, s) => sum + (Number(s[key]) || 0), 0) / recent.length;

  const pts = avg("pts");
  const reb = avg("reb");
  const ast = avg("ast");
  const stl = avg("stl");
  const blk = avg("blk");
  const to = avg("turnover");
  const fgPct = avg("fg_pct");

  // 综合评分公式（参考 PER 简化版）
  const rawScore =
    pts * 1.0 +
    reb * 1.2 +
    ast * 1.5 +
    stl * 2.0 +
    blk * 2.0 -
    to * 1.0 +
    fgPct * 20;

  // 归一化到 0-100
  const score = Math.min(100, Math.max(0, (rawScore / 60) * 100));

  return {
    score: Math.round(score * 10) / 10,
    summary: {
      pts: Math.round(pts * 10) / 10,
      reb: Math.round(reb * 10) / 10,
      ast: Math.round(ast * 10) / 10,
      stl: Math.round(stl * 10) / 10,
      blk: Math.round(blk * 10) / 10,
      to: Math.round(to * 10) / 10,
      fgPct: Math.round(fgPct * 1000) / 10,
      gamesPlayed: recent.length,
    },
  };
}

// ─── 球星卡市价模拟数据 ───────────────────────────────────────────────────────

const CARD_BRANDS = ["Panini Prizm", "Panini Select", "Topps Chrome", "Upper Deck", "Panini Mosaic"];
const CARD_PARALLELS = ["Base", "Silver Prizm", "Gold Prizm", "Red Prizm", "PSA 10", "BGS 9.5"];
const CARD_GRADES = ["Raw", "PSA 9", "PSA 10", "BGS 9", "BGS 9.5"];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function generateCardData(
  playerId: number,
  playerName: string,
  sport: string,
  performanceScore: number
) {
  const cards = [];
  
  // Create a helper to generate 90-day mock history ending at target price
  const createHistory = (targetPrice: number, volatility: number) => {
    let currentPrice = targetPrice * (1 - volatility/2); // start lower or higher
    const history = [];
    for (let d = 89; d >= 0; d--) {
      // Small random walk towards target
      const move = (Math.random() - 0.45) * volatility * targetPrice;
      const pull = (targetPrice - currentPrice) * 0.05; // slowly pull towards target
      currentPrice += move + pull;
      if (currentPrice < 5) currentPrice = 5;
      
      if (Math.random() < 0.4 || d === 0) { // 40% chance of a transaction on this day, guarantee last day
        history.push({
          date: new Date(Date.now() - d * 24 * 60 * 60 * 1000),
          price: Math.round(currentPrice * 100) / 100,
          source: Math.random() > 0.5 ? "ebay" : "pwcc",
        });
      }
    }
    // Force final price matching
    history[history.length - 1].price = targetPrice;
    return history;
  };

  const createCard = (year: number, brand: string, set: string, parallel: string, grade: string, targetPrice: number, dealScore: number) => {
    const history = createHistory(targetPrice, 0.15);
    const avg30d = history.slice(-10).reduce((sum, h) => sum + h.price, 0) / Math.min(10, history.length);
    const oldPrice = history[Math.max(0, history.length - 8)].price;
    const change7d = ((targetPrice - oldPrice) / oldPrice) * 100;
    
    return {
      year, brand, set, parallel, grade,
      basePrice: targetPrice * 0.4,
      currentPrice: targetPrice,
      avgPrice30d: Math.round(avg30d * 100) / 100,
      priceChange7d: Math.round(change7d * 10) / 10,
      dealScore,
      isDealOpportunity: dealScore > 75,
      marketSentiment: change7d > 5 ? "bullish" : change7d < -5 ? "bearish" : "neutral" as any,
      priceHistory: history
    };
  };

  if (playerName === "Victor Wembanyama") {
    cards.push(createCard(2023, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1850.50, 82));
    cards.push(createCard(2023, "Panini Prizm", "Base", "Base", "PSA 10", 275.00, 65));
    cards.push(createCard(2023, "Panini Select", "Concourse", "Silver", "Raw", 85.00, 78));
    cards.push(createCard(2023, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 12500.00, 91));
    cards.push(createCard(2024, "Panini Prizm", "Base", "Gold Prizm", "PSA 10", 3200.00, 85));
    cards.push(createCard(2023, "Panini Mosaic", "Base", "Silver", "PSA 10", 320.00, 72));
  } else if (playerName === "LeBron James") {
    cards.push(createCard(2003, "Topps Chrome", "Base", "Base", "PSA 10", 6500.00, 88));
    cards.push(createCard(2003, "Topps", "Base", "Base", "PSA 9", 1200.00, 71));
    cards.push(createCard(2003, "Upper Deck Exquisite", "Rookie Patch Auto", "Base", "BGS 9", 45000.00, 95));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 150.00, 60));
    cards.push(createCard(2021, "Panini Select", "Concourse", "Silver", "PSA 10", 85.00, 58));
    cards.push(createCard(2003, "Topps Chrome", "Base", "Refractor", "PSA 10", 8200.00, 90));
  } else if (playerName === "Stephen Curry") {
    cards.push(createCard(2009, "Topps", "Base", "Base", "PSA 10", 3500.00, 85));
    cards.push(createCard(2009, "Panini Studio", "Base", "Base", "BGS 9.5", 850.00, 74));
    cards.push(createCard(2009, "Topps Chrome", "Base", "Base", "PSA 10", 9800.00, 92));
    cards.push(createCard(2009, "Bowman Chrome", "Base", "Refractor", "PSA 10", 4500.00, 87));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 180.00, 65));
  } else if (playerName === "Shohei Ohtani") {
    cards.push(createCard(2018, "Bowman Chrome", "Batting", "Base", "PSA 10", 450.00, 90));
    cards.push(createCard(2018, "Topps Chrome Update", "Pitching", "Refractor", "PSA 10", 850.00, 82));
    cards.push(createCard(2018, "Topps Chrome", "Base", "Base", "PSA 10", 320.00, 78));
    cards.push(createCard(2023, "Topps Chrome", "Base", "Refractor", "PSA 10", 180.00, 71));
    cards.push(createCard(2018, "Bowman Chrome", "Pitching", "Gold Refractor", "PSA 10", 1200.00, 88));
  } else if (playerName === "Lionel Messi") {
    cards.push(createCard(2014, "Panini Prizm World Cup", "Base", "Base", "PSA 10", 550.00, 75));
    cards.push(createCard(2004, "Panini Megacracks", "Base", "Base", "PSA 9", 2800.00, 81));
    cards.push(createCard(2022, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 420.00, 72));
    cards.push(createCard(2018, "Panini Prizm World Cup", "Base", "Gold Prizm", "PSA 10", 1800.00, 84));
  } else if (playerName === "Patrick Mahomes") {
    cards.push(createCard(2017, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 4200.00, 89));
    cards.push(createCard(2017, "Panini Prizm", "Base", "Base", "PSA 10", 850.00, 76));
    cards.push(createCard(2017, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 18500.00, 93));
    cards.push(createCard(2017, "Panini Select", "Concourse", "Silver", "PSA 10", 320.00, 71));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Gold Prizm", "PSA 10", 680.00, 79));
  } else if (playerName === "Nikola Jokic") {
    cards.push(createCard(2015, "Panini Prizm", "Base", "Base", "PSA 9", 680.00, 82));
    cards.push(createCard(2015, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 2800.00, 88));
    cards.push(createCard(2015, "Panini Prizm", "Base", "Purple Prizm", "PSA 10", 1200.00, 85));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 320.00, 74));
    cards.push(createCard(2015, "Panini Select", "Concourse", "Silver", "Raw", 180.00, 68));
  } else if (playerName === "Luka Doncic") {
    cards.push(createCard(2018, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1450.00, 85));
    cards.push(createCard(2018, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 8200.00, 91));
    cards.push(createCard(2018, "Panini Prizm", "Base", "Gold Prizm", "PSA 10", 3800.00, 87));
    cards.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 380.00, 72));
    cards.push(createCard(2018, "Panini Select", "Concourse", "Silver", "PSA 10", 420.00, 76));
  } else if (playerName === "Giannis Antetokounmpo") {
    cards.push(createCard(2013, "Panini Prizm", "Base", "Base", "PSA 9", 850.00, 80));
    cards.push(createCard(2013, "Panini Prizm", "Base", "Red Prizm", "PSA 10", 4200.00, 88));
    cards.push(createCard(2013, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 2100.00, 85));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 280.00, 70));
    cards.push(createCard(2013, "Panini Select", "Concourse", "Silver", "Raw", 320.00, 72));
  } else if (playerName === "Jayson Tatum") {
    cards.push(createCard(2017, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680.00, 81));
    cards.push(createCard(2017, "Panini Prizm", "Emergent", "Base", "Raw", 180.00, 68));
    cards.push(createCard(2017, "Panini Prizm", "Base", "Blue Prizm", "PSA 10", 1200.00, 84));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 220.00, 66));
    cards.push(createCard(2017, "Panini Select", "Concourse", "Silver", "PSA 10", 280.00, 73));
  } else if (playerName === "Joel Embiid") {
    cards.push(createCard(2014, "Panini Prizm", "Base", "Base", "PSA 10", 980.00, 82));
    cards.push(createCard(2014, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 3400.00, 88));
    cards.push(createCard(2014, "Panini Prizm", "SP Variations", "Silver Prizm", "PSA 10", 5800.00, 91));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 180.00, 65));
  } else if (playerName === "Damian Lillard") {
    cards.push(createCard(2012, "Panini Prizm", "Base", "Base", "PSA 9", 480.00, 78));
    cards.push(createCard(2012, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1800.00, 85));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 150.00, 62));
    cards.push(createCard(2012, "Panini Select", "Concourse", "Silver", "Raw", 120.00, 60));
  } else if (playerName === "Anthony Davis") {
    cards.push(createCard(2012, "Panini Prizm", "Base", "Base", "Raw", 280.00, 74));
    cards.push(createCard(2012, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1200.00, 82));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 180.00, 65));
    cards.push(createCard(2012, "Panini Select", "Concourse", "Silver", "PSA 10", 320.00, 70));
  } else if (playerName === "Kevin Durant") {
    cards.push(createCard(2007, "Topps Chrome", "Base", "Base", "PSA 9", 1200.00, 82));
    cards.push(createCard(2007, "Topps Chrome", "Base", "Base", "PSA 10", 3500.00, 88));
    cards.push(createCard(2007, "Topps Chrome", "Base", "Refractor", "PSA 10", 5800.00, 91));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 280.00, 70));
    cards.push(createCard(2007, "Bowman Chrome", "Base", "Refractor", "PSA 10", 2800.00, 85));
  } else if (playerName === "Tyrese Haliburton") {
    cards.push(createCard(2020, "Panini Prizm", "Base", "Base", "PSA 10", 180.00, 72));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Green Prizm", "PSA 10", 420.00, 78));
    cards.push(createCard(2020, "Panini Select", "Concourse", "Silver", "Raw", 65.00, 65));
    cards.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 280.00, 74));
  } else if (playerName === "Josh Allen") {
    cards.push(createCard(2018, "Panini Prizm", "Base", "Base", "PSA 10", 680.00, 80));
    cards.push(createCard(2018, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 2800.00, 87));
    cards.push(createCard(2018, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 9800.00, 92));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 380.00, 74));
    cards.push(createCard(2018, "Panini Select", "Concourse", "Silver", "PSA 10", 280.00, 71));
  } else if (playerName === "Justin Jefferson") {
    cards.push(createCard(2020, "Panini Prizm", "Base", "Base", "PSA 10", 380.00, 78));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1450.00, 85));
    cards.push(createCard(2020, "Panini Select", "Concourse", "Silver", "Raw", 120.00, 68));
    cards.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 380.00, 72));
  } else if (playerName === "Travis Kelce") {
    cards.push(createCard(2013, "Panini Prizm", "Base", "Base", "PSA 9", 480.00, 78));
    cards.push(createCard(2013, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1800.00, 85));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 280.00, 70));
    cards.push(createCard(2013, "Panini Select", "Concourse", "Silver", "Raw", 150.00, 64));
  } else if (playerName === "Mike Trout") {
    cards.push(createCard(2011, "Topps", "Update", "Base", "PSA 10", 3200.00, 86));
    cards.push(createCard(2011, "Topps Chrome", "Update", "Refractor", "PSA 10", 8500.00, 91));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 180.00, 65));
    cards.push(createCard(2011, "Bowman Chrome", "Prospect", "Base", "PSA 10", 1800.00, 82));
  } else if (playerName === "Ronald Acuna Jr.") {
    cards.push(createCard(2018, "Topps Chrome", "Base", "Base", "PSA 10", 320.00, 78));
    cards.push(createCard(2018, "Topps Chrome Update", "Base", "Refractor Auto", "PSA 10", 1200.00, 85));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 150.00, 65));
    cards.push(createCard(2018, "Bowman Chrome", "Prospect", "Gold Refractor", "PSA 10", 680.00, 80));
  } else if (playerName === "Erling Haaland") {
    cards.push(createCard(2021, "Topps Chrome", "UEFA Champions League", "Base", "PSA 10", 280.00, 78));
    cards.push(createCard(2021, "Topps Chrome", "UEFA Champions League", "Refractor", "PSA 10", 680.00, 84));
    cards.push(createCard(2022, "Panini Prizm Premier League", "Base", "Silver Prizm", "PSA 10", 420.00, 80));
    cards.push(createCard(2014, "Panini Prizm World Cup", "Base", "Base", "PSA 10", 180.00, 68));
    cards.push(createCard(2023, "Topps Chrome", "Premier League", "Refractor", "PSA 10", 380.00, 76));
  } else if (playerName === "Mohamed Salah") {
    cards.push(createCard(2018, "Panini Prizm World Cup", "Base", "Base", "PSA 10", 320.00, 76));
    cards.push(createCard(2020, "Panini Prizm Premier League", "Base", "Silver Prizm", "PSA 10", 280.00, 74));
    cards.push(createCard(2022, "Panini Prizm Premier League", "Base", "Gold Prizm", "PSA 10", 680.00, 82));
    cards.push(createCard(2014, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 480.00, 78));
  } else if (playerName === "Bukayo Saka") {
    cards.push(createCard(2020, "Topps Chrome", "Merlin UEFA", "Base", "Raw", 120.00, 72));
    cards.push(createCard(2020, "Topps Chrome", "Merlin UEFA", "Refractor", "PSA 10", 380.00, 79));
    cards.push(createCard(2022, "Panini Prizm Premier League", "Base", "Silver Prizm", "PSA 10", 280.00, 75));
    cards.push(createCard(2023, "Topps Chrome", "Premier League", "Refractor", "PSA 10", 220.00, 71));
  } else if (playerName === "Kylian Mbappe") {
    cards.push(createCard(2018, "Panini Prizm World Cup", "Base", "Base", "BGS 9.5", 1200.00, 84));
    cards.push(createCard(2018, "Panini Prizm World Cup", "New Era", "Silver Prizm", "PSA 10", 3800.00, 90));
    cards.push(createCard(2022, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 680.00, 82));
    cards.push(createCard(2020, "Panini Prizm Ligue 1", "Base", "Silver Prizm", "PSA 10", 480.00, 78));
  } else if (playerName === "Vinicius Junior") {
    cards.push(createCard(2018, "Panini Donruss", "Rated Rookie", "Base", "PSA 9", 280.00, 74));
    cards.push(createCard(2018, "Panini Donruss Optic", "Rated Rookie", "Base", "PSA 10", 680.00, 82));
    cards.push(createCard(2022, "Panini Prizm La Liga", "Base", "Silver Prizm", "PSA 10", 380.00, 76));
    cards.push(createCard(2018, "Panini Prizm World Cup", "Base", "Base", "PSA 10", 180.00, 68));
  } else if (playerName === "Ja Morant") {
    cards.push(createCard(2019, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 2800.00, 87));
    cards.push(createCard(2019, "Panini Prizm", "Base", "Base", "PSA 10", 480.00, 74));
    cards.push(createCard(2019, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 6800.00, 91));
    cards.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 380.00, 72));
    cards.push(createCard(2019, "Panini Select", "Concourse", "Silver", "PSA 10", 320.00, 70));
  } else if (playerName === "Zion Williamson") {
    cards.push(createCard(2019, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1200.00, 83));
    cards.push(createCard(2019, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 9800.00, 92));
    cards.push(createCard(2019, "Panini Select", "Concourse", "Silver", "PSA 10", 480.00, 76));
    cards.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 420.00, 72));
  } else if (playerName === "Trae Young") {
    cards.push(createCard(2018, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 980.00, 83));
    cards.push(createCard(2018, "Panini Prizm", "Base", "Base", "PSA 10", 280.00, 72));
    cards.push(createCard(2018, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 4800.00, 88));
    cards.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 280.00, 70));
    cards.push(createCard(2018, "Panini Select", "Concourse", "Silver", "PSA 10", 220.00, 68));
  } else if (playerName === "Devin Booker") {
    cards.push(createCard(2015, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 3200.00, 87));
    cards.push(createCard(2015, "Panini Prizm", "Base", "Base", "PSA 9", 680.00, 76));
    cards.push(createCard(2015, "Panini Prizm Emergent", "Rookie", "Base", "Raw", 280.00, 70));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 320.00, 72));
    cards.push(createCard(2015, "Panini Select", "Concourse", "Silver", "PSA 10", 380.00, 74));
  } else if (playerName === "Shai Gilgeous-Alexander") {
    cards.push(createCard(2018, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 2800.00, 88));
    cards.push(createCard(2018, "Panini Prizm", "Base", "Base", "PSA 10", 580.00, 76));
    cards.push(createCard(2018, "Panini Donruss", "Rated Rookie", "Green", "PSA 10", 480.00, 74));
    cards.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680.00, 80));
    cards.push(createCard(2018, "Panini Select", "Concourse", "Silver", "PSA 10", 380.00, 73));
  } else if (playerName === "Anthony Edwards") {
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1800.00, 87));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Base", "PSA 9", 380.00, 74));
    cards.push(createCard(2020, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 7200.00, 91));
    cards.push(createCard(2022, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680.00, 82));
    cards.push(createCard(2020, "Panini Select", "Concourse", "Silver", "PSA 10", 320.00, 72));
  } else if (playerName === "Cade Cunningham") {
    cards.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680.00, 78));
    cards.push(createCard(2021, "Panini Prizm Choice", "Base", "Blue/Yellow/Green", "PSA 10", 1200.00, 82));
    cards.push(createCard(2021, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 3800.00, 86));
    cards.push(createCard(2021, "Panini Select", "Concourse", "Silver", "PSA 10", 280.00, 70));
  } else if (playerName === "Evan Mobley") {
    cards.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 580.00, 79));
    cards.push(createCard(2021, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 4200.00, 87));
    cards.push(createCard(2021, "Panini Select", "Concourse", "Silver", "PSA 10", 280.00, 72));
    cards.push(createCard(2022, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 380.00, 74));
  } else if (playerName === "Paolo Banchero") {
    cards.push(createCard(2022, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680.00, 79));
    cards.push(createCard(2022, "Panini Prizm Draft", "Base", "Orange Pulsar", "PSA 10", 1200.00, 83));
    cards.push(createCard(2022, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 4800.00, 87));
    cards.push(createCard(2022, "Panini Select", "Concourse", "Silver", "PSA 10", 280.00, 71));
  } else if (playerName === "Lamar Jackson") {
    cards.push(createCard(2018, "Panini Prizm", "Rookie Introduction", "Silver Prizm", "PSA 10", 3200.00, 88));
    cards.push(createCard(2018, "Panini Prizm Silver", "Instant Impact", "Silver Prizm", "PSA 10", 4800.00, 90));
    cards.push(createCard(2018, "Panini Select", "Concourse", "Silver", "PSA 10", 680.00, 76));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 580.00, 78));
  } else if (playerName === "Justin Herbert") {
    cards.push(createCard(2020, "Panini National Treasures", "Tremendous Treasures", "Base", "PSA 10", 8800.00, 90));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1800.00, 84));
    cards.push(createCard(2020, "Panini Select", "Concourse", "Silver", "PSA 10", 480.00, 74));
    cards.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680.00, 78));
  } else if (playerName === "Kyler Murray") {
    cards.push(createCard(2019, "Panini Prizm", "Rookies", "Silver Prizm", "PSA 10", 1200.00, 81));
    cards.push(createCard(2019, "Panini Prizm", "Rookies", "Base", "PSA 10", 380.00, 72));
    cards.push(createCard(2019, "Panini Select", "Concourse", "Silver", "PSA 10", 280.00, 68));
    cards.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 380.00, 70));
  } else if (playerName === "Fernando Tatis Jr.") {
    cards.push(createCard(2019, "Topps Chrome", "Base", "Refractor", "PSA 10", 1800.00, 85));
    cards.push(createCard(2019, "Topps Chrome Auto", "Base", "Sepia Refractor Auto", "PSA 9", 3200.00, 88));
    cards.push(createCard(2021, "Topps Chrome", "Base", "Refractor", "PSA 10", 680.00, 78));
    cards.push(createCard(2019, "Bowman Chrome", "Prospect", "Gold Refractor", "PSA 10", 1200.00, 82));
  } else if (playerName === "Juan Soto") {
    cards.push(createCard(2018, "Topps Chrome", "Base", "Refractor", "PSA 10", 1200.00, 83));
    cards.push(createCard(2018, "Topps Update Chrome", "Base", "Base", "PSA 10", 680.00, 78));
    cards.push(createCard(2021, "Topps Chrome", "Base", "Refractor", "PSA 10", 480.00, 74));
    cards.push(createCard(2018, "Bowman Chrome", "Prospect", "Refractor", "PSA 10", 580.00, 76));
  } else if (playerName === "Julio Rodriguez") {
    cards.push(createCard(2022, "Topps Chrome", "Update Rookie Debut", "Purple Refractor", "PSA 10", 980.00, 82));
    cards.push(createCard(2022, "Topps Chrome Auto", "Update Rookie", "Refractor Auto", "BGS 9.5", 2800.00, 87));
    cards.push(createCard(2023, "Topps Chrome", "Base", "Refractor", "PSA 10", 480.00, 76));
    cards.push(createCard(2022, "Bowman Chrome", "Prospect", "Gold Refractor", "PSA 10", 680.00, 78));
  } else if (playerName === "Jude Bellingham") {
    cards.push(createCard(2020, "Topps Chrome UCL", "Base", "Base", "PSA 10", 2800.00, 87));
    cards.push(createCard(2020, "Topps Chrome Bundesliga", "Base", "Base", "PSA 10", 1800.00, 84));
    cards.push(createCard(2022, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 1200.00, 82));
    cards.push(createCard(2020, "Topps Chrome", "Base", "Refractor", "PSA 10", 980.00, 80));
  } else if (playerName === "Pedri") {
    cards.push(createCard(2021, "Topps Chrome UCL", "Base", "Base", "PSA 10", 680.00, 80));
    cards.push(createCard(2021, "Topps Chrome", "Base", "Purple Carbon Fiber", "PSA 10", 1200.00, 84));
    cards.push(createCard(2022, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 480.00, 76));
  } else if (playerName === "Neymar Jr.") {
    cards.push(createCard(2014, "Panini Prizm World Cup", "Base", "Base", "PSA 10", 1200.00, 82));
    cards.push(createCard(2018, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 2800.00, 87));
    cards.push(createCard(2022, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 680.00, 76));
  } else if (playerName === "Kobe Bryant") {
    cards.push(createCard(1996, "Topps Chrome", "Base", "Base", "PSA 9", 8500.00, 90));
    cards.push(createCard(1996, "Topps Chrome", "Base", "Refractor", "PSA 10", 28000.00, 96));
    cards.push(createCard(1996, "Topps Chrome", "Base", "Base", "PSA 10", 18000.00, 94));
    cards.push(createCard(2003, "Topps Chrome", "Base", "Refractor", "PSA 10", 4800.00, 88));
    cards.push(createCard(2007, "Topps Chrome", "Base", "Base", "PSA 10", 2200.00, 85));
  } else if (playerName === "Shaquille O'Neal") {
    cards.push(createCard(1992, "Topps", "Base", "Base", "BCCG 9", 280.00, 78));
    cards.push(createCard(1992, "Topps", "Archives Gold", "Gold", "PSA 10", 1800.00, 86));
    cards.push(createCard(1993, "Topps Finest", "Base", "Base", "PSA 10", 680.00, 82));
    cards.push(createCard(1996, "Topps Chrome", "Base", "Refractor", "PSA 10", 1200.00, 84));
  } else if (playerName === "Dwyane Wade") {
    cards.push(createCard(2003, "Topps Chrome", "Base", "Base", "PSA 10", 3800.00, 87));
    cards.push(createCard(2003, "Topps Chrome", "Base", "Refractor", "PSA 10", 8500.00, 91));
    cards.push(createCard(2003, "Upper Deck Exquisite", "Rookie Patch Auto", "Base", "BGS 9", 12000.00, 93));
    cards.push(createCard(2007, "Topps Chrome", "Base", "Base", "PSA 10", 680.00, 80));
  } else if (playerName === "Tim Duncan") {
    cards.push(createCard(1997, "Topps Chrome", "Base", "Base", "PSA 10", 2800.00, 87));
    cards.push(createCard(1997, "Topps Chrome", "Base", "Refractor", "PSA 10", 6800.00, 91));
    cards.push(createCard(1997, "Topps Finest", "Base", "Base", "PSA 10", 1200.00, 84));
    cards.push(createCard(2003, "Topps Chrome", "Base", "Base", "PSA 10", 480.00, 78));
  } else if (playerName === "Dirk Nowitzki") {
    cards.push(createCard(1998, "Topps Chrome", "Base", "Base", "PSA 10", 1800.00, 85));
    cards.push(createCard(1998, "Topps Chrome", "Base", "BCCG 10", "BGS 10", 4200.00, 89));
    cards.push(createCard(1998, "Topps Finest", "Base", "Base", "PSA 10", 680.00, 81));
    cards.push(createCard(2007, "Topps Chrome", "Base", "Base", "PSA 10", 380.00, 75));
  } else if (playerName === "James Harden") {
    cards.push(createCard(2009, "Topps Chrome", "Base", "Base", "BGS 9", 680.00, 79));
    cards.push(createCard(2009, "Topps Chrome", "Base", "Refractor", "BGS 9.5", 1800.00, 85));
    cards.push(createCard(2009, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1200.00, 82));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 280.00, 70));
  } else if (playerName === "Kyrie Irving") {
    cards.push(createCard(2012, "Panini Prizm", "Base", "Base", "PSA 9", 480.00, 78));
    cards.push(createCard(2012, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1800.00, 85));
    cards.push(createCard(2012, "Panini Prizm", "Base", "Base", "PSA 10", 980.00, 82));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 220.00, 68));
  } else if (playerName === "Russell Westbrook") {
    cards.push(createCard(2008, "Topps Chrome", "Base", "Base", "PSA 9", 380.00, 76));
    cards.push(createCard(2008, "Topps Chrome", "Base", "Refractor", "PSA 10", 1200.00, 83));
    cards.push(createCard(2008, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680.00, 79));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 180.00, 65));
  } else if (playerName === "Kawhi Leonard") {
    cards.push(createCard(2011, "SP Authentic", "Rookie Auto", "Base", "PSA 10", 1800.00, 84));
    cards.push(createCard(2014, "Panini Prizm", "Base", "Blue Prizm", "PSA 10", 2800.00, 87));
    cards.push(createCard(2011, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 980.00, 81));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 280.00, 70));
  } else if (playerName === "Draymond Green") {
    cards.push(createCard(2012, "Panini Prizm", "Base", "Base", "PSA 10", 480.00, 77));
    cards.push(createCard(2012, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 1200.00, 82));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 180.00, 65));
  } else if (playerName === "Karl-Anthony Towns") {
    cards.push(createCard(2015, "Panini Prizm Emergent", "Rookie", "Base", "Raw", 280.00, 72));
    cards.push(createCard(2015, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680.00, 78));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 180.00, 65));
  } else if (playerName === "Tom Brady") {
    cards.push(createCard(2000, "Bowman Chrome", "Base", "Base", "PSA 10", 28000.00, 95));
    cards.push(createCard(2000, "Bowman Chrome", "Base", "Refractor", "PSA 10", 68000.00, 98));
    cards.push(createCard(2000, "Topps Chrome", "Base", "Base", "PSA 10", 18000.00, 93));
    cards.push(createCard(2005, "Topps Chrome", "Base", "Refractor", "PSA 10", 2800.00, 85));
  } else if (playerName === "Aaron Rodgers") {
    cards.push(createCard(2005, "Topps Chrome", "Base", "Base", "PSA 9", 1800.00, 84));
    cards.push(createCard(2005, "Topps Chrome", "Base", "Refractor Auto", "PSA 10", 8500.00, 91));
    cards.push(createCard(2005, "Topps Chrome", "Base", "Base", "PSA 10", 4200.00, 88));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 480.00, 76));
  } else if (playerName === "Peyton Manning") {
    cards.push(createCard(1998, "Topps Chrome", "Base", "Base", "PSA 10", 3800.00, 87));
    cards.push(createCard(1998, "Topps Chrome", "Base", "Refractor", "BGS 9", 8500.00, 91));
    cards.push(createCard(1998, "Topps Finest", "Base", "Base", "PSA 10", 1200.00, 83));
  } else if (playerName === "Jerry Rice") {
    cards.push(createCard(1986, "Topps", "Base", "Base", "PSA 10", 4800.00, 89));
    cards.push(createCard(1986, "Topps", "Base", "Base", "PSA 9", 1200.00, 82));
    cards.push(createCard(1990, "Topps", "Base", "Base", "PSA 10", 680.00, 78));
  } else if (playerName === "Joe Burrow") {
    cards.push(createCard(2020, "Panini Prizm", "Base", "Base", "PSA 10", 480.00, 77));
    cards.push(createCard(2020, "Panini Prizm", "Base", "Red/Yellow", "PSA 10", 2800.00, 86));
    cards.push(createCard(2020, "Panini National Treasures", "Rookie Patch Auto", "Base", "BGS 9.5", 6800.00, 90));
    cards.push(createCard(2021, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 680.00, 79));
  } else if (playerName === "Ken Griffey Jr.") {
    cards.push(createCard(1989, "Topps", "Base", "Base", "PSA 10", 2800.00, 86));
    cards.push(createCard(1989, "Topps", "Traded", "Base", "PSA 10", 4800.00, 89));
    cards.push(createCard(1990, "Topps", "Base", "Base", "PSA 10", 680.00, 79));
    cards.push(createCard(1989, "Bowman", "Base", "Base", "PSA 10", 1200.00, 83));
  } else if (playerName === "Derek Jeter") {
    cards.push(createCard(1993, "Bowman", "Base", "Base", "PSA 10", 3800.00, 87));
    cards.push(createCard(1993, "Bowman", "Base", "Base", "PSA 9", 1200.00, 81));
    cards.push(createCard(1993, "Topps", "Base", "Base", "PSA 10", 1800.00, 84));
    cards.push(createCard(1994, "Topps", "Base", "Base", "PSA 10", 680.00, 78));
  } else if (playerName === "Barry Bonds") {
    cards.push(createCard(1987, "Topps", "Base", "Base", "PSA 10", 1800.00, 84));
    cards.push(createCard(1987, "Topps", "Base", "Base", "PSA 9", 480.00, 77));
    cards.push(createCard(1990, "Topps", "Base", "Base", "PSA 10", 380.00, 74));
  } else if (playerName === "Bryce Harper") {
    cards.push(createCard(2011, "Bowman Chrome", "Prospect", "Base", "PSA 10", 1800.00, 84));
    cards.push(createCard(2011, "Bowman Chrome", "Prospect", "Refractor Auto", "PSA 10", 4800.00, 89));
    cards.push(createCard(2012, "Topps Chrome", "Base", "Refractor", "PSA 10", 680.00, 79));
  } else if (playerName === "Lionel Messi") {
    cards.push(createCard(2014, "Panini Prizm World Cup", "Base", "Base", "PSA 10", 550.00, 75));
    cards.push(createCard(2004, "Panini Megacracks", "Base", "Base", "PSA 9", 2800.00, 81));
    cards.push(createCard(2022, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 420.00, 72));
    cards.push(createCard(2018, "Panini Prizm World Cup", "Base", "Black Gold", "PSA 10", 8800.00, 91));
    cards.push(createCard(2018, "Panini Prizm World Cup", "Base", "Mojo Prizm", "PSA 10", 4200.00, 87));
  } else if (playerName === "Cristiano Ronaldo") {
    cards.push(createCard(2018, "Panini Prizm World Cup", "Base", "Base", "PSA 10", 680.00, 79));
    cards.push(createCard(2018, "Panini Prizm World Cup", "Scorers Club", "Silver Prizm", "PSA 10", 2800.00, 86));
    cards.push(createCard(2022, "Panini Prizm World Cup", "Base", "Silver Prizm", "PSA 10", 480.00, 75));
    cards.push(createCard(2014, "Panini Prizm World Cup", "Base", "Base", "PSA 10", 380.00, 72));

  // ── NHL ──
  } else if (playerName === "Connor McDavid") {
    cards.push(createCard(2015, "Upper Deck", "Young Guns", "Base", "PSA 10", 3800.00, 89));
    cards.push(createCard(2015, "Upper Deck", "Young Guns", "Base", "PSA 9", 1200.00, 82));
    cards.push(createCard(2016, "Upper Deck", "Young Guns", "Base", "PSA 10", 2200.00, 86));
    cards.push(createCard(2020, "Upper Deck", "Base", "Base", "PSA 10", 480.00, 75));
    cards.push(createCard(2015, "Upper Deck", "Young Guns Jumbo", "Base", "BGS 9.5", 8500.00, 92));
  } else if (playerName === "Sidney Crosby") {
    cards.push(createCard(2005, "Upper Deck", "Young Guns", "Base", "PSA 10", 12000.00, 94));
    cards.push(createCard(2005, "Upper Deck", "Young Guns", "Base", "PSA 9", 3800.00, 87));
    cards.push(createCard(2005, "Upper Deck", "Young Guns", "Base", "BGS 9.5", 8500.00, 92));
    cards.push(createCard(2010, "Upper Deck", "Base", "Base", "PSA 10", 680.00, 79));
  } else if (playerName === "Alexander Ovechkin") {
    cards.push(createCard(2005, "Upper Deck", "Young Guns", "Base", "PSA 10", 8500.00, 92));
    cards.push(createCard(2005, "Upper Deck", "Young Guns", "Base", "PSA 9", 2800.00, 85));
    cards.push(createCard(2005, "Upper Deck", "Young Guns", "Base", "BGS 9.5", 5800.00, 90));
    cards.push(createCard(2010, "Upper Deck", "Base", "Base", "PSA 10", 480.00, 76));

  // ── Soccer 传奇 ──
  } else if (playerName === "Ronaldinho") {
    cards.push(createCard(2004, "Panini", "Mega Cracks", "Base", "PSA 9", 1800.00, 84));
    cards.push(createCard(2006, "Panini", "World Cup", "Base", "PSA 10", 2800.00, 87));
    cards.push(createCard(2004, "Topps", "Match Attax", "Base", "PSA 10", 980.00, 81));
  } else if (playerName === "Zinedine Zidane") {
    cards.push(createCard(2006, "Panini", "World Cup", "Base", "PSA 10", 3800.00, 88));
    cards.push(createCard(2002, "Panini", "World Cup", "Base", "PSA 9", 1800.00, 84));
    cards.push(createCard(1998, "Panini", "World Cup", "Base", "PSA 10", 4800.00, 90));
  } else if (playerName === "Thierry Henry") {
    cards.push(createCard(2006, "Panini", "World Cup", "Base", "PSA 10", 2800.00, 86));
    cards.push(createCard(2003, "Topps", "Premier League", "Base", "PSA 10", 1200.00, 82));
    cards.push(createCard(1998, "Panini", "World Cup", "Base", "PSA 9", 980.00, 80));

  // ── Soccer 新生代 ──
  } else if (playerName === "Lamine Yamal") {
    cards.push(createCard(2024, "Panini Select FIFA", "Base", "Silver Prizm Patch", "Raw", 4800.00, 91));
    cards.push(createCard(2024, "Topps Now", "Champions League", "Base", "Raw", 1200.00, 84));
    cards.push(createCard(2024, "Panini Select La Liga", "Base", "Gold Prizm", "PSA 10", 8500.00, 93));
    cards.push(createCard(2024, "Topps", "Base", "Base", "PSA 10", 680.00, 79));
  } else if (playerName === "Florian Wirtz") {
    cards.push(createCard(2023, "Topps Chrome UEFA", "Base", "Base", "PSA 10", 1200.00, 82));
    cards.push(createCard(2022, "Topps Chrome UEFA", "Base", "Refractor", "PSA 10", 2800.00, 87));
    cards.push(createCard(2022, "Topps Chrome", "Base", "Pink Shimmer", "PSA 10", 980.00, 81));
    cards.push(createCard(2024, "Topps Chrome Bundesliga", "Base", "Base", "PSA 10", 680.00, 78));

  // ── NBA 传奇 ──
  } else if (playerName === "Klay Thompson") {
    // 2012 Prizm Rookie (Warriors时代)
    cards.push(createCard(2012, "Panini Prizm", "Base", "Silver Prizm", "PSA 10", 4800.00, 90));
    cards.push(createCard(2012, "Panini Prizm", "Base", "Silver Prizm", "PSA 9", 1200.00, 85));
    cards.push(createCard(2012, "Panini Prizm", "Base", "Base", "Raw", 280.00, 78));
    // 2012 National Treasures RPA
    cards.push(createCard(2012, "National Treasures", "Rookie Patch Auto", "RPA /25", "BGS 9.5", 18000.00, 95));
    // 2023 Prizm White Ice
    cards.push(createCard(2023, "Panini Prizm", "Base", "White Ice /35", "PSA 9", 380.00, 82));
    // 2023 National Treasures Clutch Factor
    cards.push(createCard(2023, "National Treasures", "Clutch Factor Signatures", "RLC-PRIME /10", "Raw", 2800.00, 88));
    // 2024 Topps Chrome (Mavericks)
    cards.push(createCard(2024, "Topps Chrome", "Base", "Green Refractor /99", "Raw", 45.00, 72));
    // 2024 Select
    cards.push(createCard(2024, "Panini Select", "Concourse", "White Prizm", "Raw", 28.00, 68));
    // 2020 Optic Holo
    cards.push(createCard(2020, "Donruss Optic", "Base", "Holo", "PSA 10", 180.00, 80));
    // 2021 Optic Holo
    cards.push(createCard(2021, "Donruss Optic", "Base", "Holo", "Raw", 35.00, 74));

  } else if (playerName === "Michael Jordan") {
    cards.push(createCard(1986, "Fleer", "Base", "Base", "PSA 10", 480000.00, 99));
    cards.push(createCard(1986, "Fleer", "Base", "Base", "PSA 9", 52000.00, 95));
    cards.push(createCard(1986, "Fleer", "Base", "Base", "BGS 9.5", 180000.00, 97));
    cards.push(createCard(1997, "Topps Chrome", "Base", "Refractor", "PSA 10", 8500.00, 91));
    cards.push(createCard(1986, "Fleer", "Sticker", "Base", "PSA 10", 28000.00, 93));
  } else if (playerName === "Magic Johnson") {
    cards.push(createCard(1980, "Topps", "Base", "Base", "PSA 10", 28000.00, 93));
    cards.push(createCard(1980, "Topps", "Base", "Base", "PSA 9", 8500.00, 88));
    cards.push(createCard(1980, "Topps", "Base", "Base", "BGS 9", 4800.00, 85));
    cards.push(createCard(1986, "Fleer", "Base", "Base", "PSA 10", 12000.00, 91));
  } else if (playerName === "Larry Bird") {
    cards.push(createCard(1980, "Topps", "Base", "Base", "PSA 10", 28000.00, 93));
    cards.push(createCard(1980, "Topps", "Base", "Base", "PSA 9", 8500.00, 88));
    cards.push(createCard(1986, "Fleer", "Base", "Base", "PSA 10", 12000.00, 91));
    cards.push(createCard(1986, "Fleer", "Base", "Base", "PSA 9", 3800.00, 85));

  // ── 历史传奇 ──
  } else if (playerName === "Wayne Gretzky") {
    cards.push(createCard(1979, "O-Pee-Chee", "Base", "Base", "PSA 10", 3600000.00, 99));
    cards.push(createCard(1979, "O-Pee-Chee", "Base", "Base", "PSA 9", 380000.00, 96));
    cards.push(createCard(1979, "O-Pee-Chee", "Base", "Base", "PSA 8", 85000.00, 92));
    cards.push(createCard(1985, "O-Pee-Chee", "Base", "Base", "PSA 10", 28000.00, 89));
  } else if (playerName === "Babe Ruth") {
    cards.push(createCard(1933, "Goudey", "Base", "Base", "PSA 9", 480000.00, 97));
    cards.push(createCard(1933, "Goudey", "Base", "Base", "PSA 8", 120000.00, 93));
    cards.push(createCard(1934, "Goudey", "Base", "Base", "PSA 9", 280000.00, 95));
  } else if (playerName === "Wilt Chamberlain") {
    cards.push(createCard(1961, "Fleer", "Base", "Base", "PSA 10", 180000.00, 96));
    cards.push(createCard(1961, "Fleer", "Base", "Base", "PSA 9", 48000.00, 92));
    cards.push(createCard(1969, "Topps", "Base", "Base", "PSA 10", 28000.00, 89));

  } else {
    // Generate some basic generic data for others
    const randScore = 60 + Math.random() * 30;
    cards.push(createCard(2020, "Panini Prizm", "Base", "Base", "PSA 10", 100 + Math.random() * 400, randScore));
    cards.push(createCard(2021, "Panini Select", "Premier", "Silver", "Raw", 40 + Math.random() * 100, randScore - 5));
  }

  return cards;
}

// ─── 种子数据：预置知名球员 ────────────────────────────────────────────────────

export const SEED_PLAYERS = [
  // NBA
  { externalId: "nba-1", name: "LeBron James", sport: "NBA" as const, team: "Los Angeles Lakers", position: "SF", performanceScore: 88 },
  { externalId: "nba-2", name: "Stephen Curry", sport: "NBA" as const, team: "Golden State Warriors", position: "PG", performanceScore: 91 },
  { externalId: "nba-3", name: "Kevin Durant", sport: "NBA" as const, team: "Phoenix Suns", position: "SF", performanceScore: 87 },
  { externalId: "nba-4", name: "Giannis Antetokounmpo", sport: "NBA" as const, team: "Milwaukee Bucks", position: "PF", performanceScore: 93 },
  { externalId: "nba-5", name: "Luka Doncic", sport: "NBA" as const, team: "Dallas Mavericks", position: "PG", performanceScore: 95 },
  { externalId: "nba-6", name: "Nikola Jokic", sport: "NBA" as const, team: "Denver Nuggets", position: "C", performanceScore: 96 },
  { externalId: "nba-7", name: "Joel Embiid", sport: "NBA" as const, team: "Philadelphia 76ers", position: "C", performanceScore: 82 },
  { externalId: "nba-8", name: "Jayson Tatum", sport: "NBA" as const, team: "Boston Celtics", position: "SF", performanceScore: 89 },
  { externalId: "nba-9", name: "Damian Lillard", sport: "NBA" as const, team: "Milwaukee Bucks", position: "PG", performanceScore: 84 },
  { externalId: "nba-10", name: "Anthony Davis", sport: "NBA" as const, team: "Los Angeles Lakers", position: "PF", performanceScore: 85 },
  { externalId: "nba-11", name: "Victor Wembanyama", sport: "NBA" as const, team: "San Antonio Spurs", position: "C", performanceScore: 90 },
  { externalId: "nba-12", name: "Tyrese Haliburton", sport: "NBA" as const, team: "Indiana Pacers", position: "PG", performanceScore: 83 },
  // NFL
  { externalId: "nfl-1", name: "Patrick Mahomes", sport: "NFL" as const, team: "Kansas City Chiefs", position: "QB", performanceScore: 94 },
  { externalId: "nfl-2", name: "Josh Allen", sport: "NFL" as const, team: "Buffalo Bills", position: "QB", performanceScore: 92 },
  { externalId: "nfl-3", name: "Justin Jefferson", sport: "NFL" as const, team: "Minnesota Vikings", position: "WR", performanceScore: 91 },
  { externalId: "nfl-4", name: "Travis Kelce", sport: "NFL" as const, team: "Kansas City Chiefs", position: "TE", performanceScore: 86 },
  // MLB
  { externalId: "mlb-1", name: "Shohei Ohtani", sport: "MLB" as const, team: "Los Angeles Dodgers", position: "DH/SP", performanceScore: 98 },
  { externalId: "mlb-2", name: "Mike Trout", sport: "MLB" as const, team: "Los Angeles Angels", position: "CF", performanceScore: 80 },
  { externalId: "mlb-3", name: "Ronald Acuna Jr.", sport: "MLB" as const, team: "Atlanta Braves", position: "RF", performanceScore: 88 },
  // EPL
  { externalId: "epl-1", name: "Erling Haaland", sport: "EPL" as const, team: "Manchester City", position: "ST", performanceScore: 95 },
  { externalId: "epl-2", name: "Mohamed Salah", sport: "EPL" as const, team: "Liverpool", position: "RW", performanceScore: 89 },
  { externalId: "epl-3", name: "Bukayo Saka", sport: "EPL" as const, team: "Arsenal", position: "RW", performanceScore: 87 },
  // NBA 新生代
  { externalId: "nba-13", name: "Ja Morant", sport: "NBA" as const, team: "Memphis Grizzlies", position: "PG", performanceScore: 88 },
  { externalId: "nba-14", name: "Zion Williamson", sport: "NBA" as const, team: "New Orleans Pelicans", position: "PF", performanceScore: 87 },
  { externalId: "nba-15", name: "Trae Young", sport: "NBA" as const, team: "Atlanta Hawks", position: "PG", performanceScore: 86 },
  { externalId: "nba-16", name: "Devin Booker", sport: "NBA" as const, team: "Phoenix Suns", position: "SG", performanceScore: 89 },
  { externalId: "nba-17", name: "Shai Gilgeous-Alexander", sport: "NBA" as const, team: "Oklahoma City Thunder", position: "SG", performanceScore: 93 },
  { externalId: "nba-18", name: "Anthony Edwards", sport: "NBA" as const, team: "Minnesota Timberwolves", position: "SG", performanceScore: 91 },
  { externalId: "nba-19", name: "Cade Cunningham", sport: "NBA" as const, team: "Detroit Pistons", position: "PG", performanceScore: 82 },
  { externalId: "nba-20", name: "Evan Mobley", sport: "NBA" as const, team: "Cleveland Cavaliers", position: "C", performanceScore: 84 },
  { externalId: "nba-21", name: "Paolo Banchero", sport: "NBA" as const, team: "Orlando Magic", position: "PF", performanceScore: 83 },
  // NFL 新生代
  { externalId: "nfl-5", name: "Lamar Jackson", sport: "NFL" as const, team: "Baltimore Ravens", position: "QB", performanceScore: 93 },
  { externalId: "nfl-6", name: "Justin Herbert", sport: "NFL" as const, team: "Los Angeles Chargers", position: "QB", performanceScore: 88 },
  { externalId: "nfl-7", name: "Kyler Murray", sport: "NFL" as const, team: "Arizona Cardinals", position: "QB", performanceScore: 84 },
  // MLB 新生代
  { externalId: "mlb-4", name: "Fernando Tatis Jr.", sport: "MLB" as const, team: "San Diego Padres", position: "SS", performanceScore: 87 },
  { externalId: "mlb-5", name: "Juan Soto", sport: "MLB" as const, team: "New York Yankees", position: "LF", performanceScore: 90 },
  { externalId: "mlb-6", name: "Julio Rodriguez", sport: "MLB" as const, team: "Seattle Mariners", position: "CF", performanceScore: 85 },
  // Soccer 新生代
  { externalId: "soccer-1", name: "Jude Bellingham", sport: "EPL" as const, team: "Real Madrid", position: "CM", performanceScore: 92 },
  { externalId: "soccer-2", name: "Pedri", sport: "EPL" as const, team: "FC Barcelona", position: "CM", performanceScore: 88 },
  { externalId: "soccer-3", name: "Neymar Jr.", sport: "EPL" as const, team: "Al-Hilal", position: "LW", performanceScore: 82 },
  // NBA 传奇
  { externalId: "nba-legend-1", name: "Kobe Bryant", sport: "NBA" as const, team: "Los Angeles Lakers", position: "SG", performanceScore: 97 },
  { externalId: "nba-legend-2", name: "Shaquille O'Neal", sport: "NBA" as const, team: "Los Angeles Lakers", position: "C", performanceScore: 95 },
  { externalId: "nba-legend-3", name: "Dwyane Wade", sport: "NBA" as const, team: "Miami Heat", position: "SG", performanceScore: 93 },
  { externalId: "nba-legend-4", name: "Tim Duncan", sport: "NBA" as const, team: "San Antonio Spurs", position: "PF", performanceScore: 96 },
  { externalId: "nba-legend-5", name: "Dirk Nowitzki", sport: "NBA" as const, team: "Dallas Mavericks", position: "PF", performanceScore: 94 },
  { externalId: "nba-legend-6", name: "James Harden", sport: "NBA" as const, team: "Los Angeles Clippers", position: "SG", performanceScore: 87 },
  { externalId: "nba-legend-7", name: "Kyrie Irving", sport: "NBA" as const, team: "Dallas Mavericks", position: "PG", performanceScore: 86 },
  { externalId: "nba-legend-8", name: "Russell Westbrook", sport: "NBA" as const, team: "Denver Nuggets", position: "PG", performanceScore: 84 },
  { externalId: "nba-legend-9", name: "Kawhi Leonard", sport: "NBA" as const, team: "Los Angeles Clippers", position: "SF", performanceScore: 88 },
  { externalId: "nba-legend-klay", name: "Klay Thompson", sport: "NBA" as const, team: "Dallas Mavericks", position: "SG", performanceScore: 87 },
  { externalId: "nba-legend-10", name: "Draymond Green", sport: "NBA" as const, team: "Golden State Warriors", position: "PF", performanceScore: 80 },
  { externalId: "nba-legend-11", name: "Karl-Anthony Towns", sport: "NBA" as const, team: "New York Knicks", position: "C", performanceScore: 83 },
  // NFL 传奇
  { externalId: "nfl-legend-1", name: "Tom Brady", sport: "NFL" as const, team: "New England Patriots", position: "QB", performanceScore: 99 },
  { externalId: "nfl-legend-2", name: "Aaron Rodgers", sport: "NFL" as const, team: "New York Jets", position: "QB", performanceScore: 92 },
  { externalId: "nfl-legend-3", name: "Peyton Manning", sport: "NFL" as const, team: "Indianapolis Colts", position: "QB", performanceScore: 96 },
  { externalId: "nfl-legend-4", name: "Jerry Rice", sport: "NFL" as const, team: "San Francisco 49ers", position: "WR", performanceScore: 99 },
  { externalId: "nfl-legend-5", name: "Joe Burrow", sport: "NFL" as const, team: "Cincinnati Bengals", position: "QB", performanceScore: 89 },
  // MLB 传奇
  { externalId: "mlb-legend-1", name: "Ken Griffey Jr.", sport: "MLB" as const, team: "Seattle Mariners", position: "CF", performanceScore: 97 },
  { externalId: "mlb-legend-2", name: "Derek Jeter", sport: "MLB" as const, team: "New York Yankees", position: "SS", performanceScore: 95 },
  { externalId: "mlb-legend-3", name: "Barry Bonds", sport: "MLB" as const, team: "San Francisco Giants", position: "LF", performanceScore: 94 },
  { externalId: "mlb-legend-4", name: "Bryce Harper", sport: "MLB" as const, team: "Philadelphia Phillies", position: "RF", performanceScore: 88 },
  // Soccer 传奇
  { externalId: "soccer-legend-1", name: "Lionel Messi", sport: "EPL" as const, team: "Inter Miami CF", position: "RW", performanceScore: 98 },
  { externalId: "soccer-legend-2", name: "Cristiano Ronaldo", sport: "EPL" as const, team: "Al-Nassr", position: "ST", performanceScore: 97 },
  // NHL
  { externalId: "nhl-1", name: "Connor McDavid", sport: "NHL" as const, team: "Edmonton Oilers", position: "C", performanceScore: 98 },
  { externalId: "nhl-2", name: "Sidney Crosby", sport: "NHL" as const, team: "Pittsburgh Penguins", position: "C", performanceScore: 96 },
  { externalId: "nhl-3", name: "Alexander Ovechkin", sport: "NHL" as const, team: "Washington Capitals", position: "LW", performanceScore: 95 },
  // Soccer 传奇
  { externalId: "soccer-legend-3", name: "Ronaldinho", sport: "EPL" as const, team: "FC Barcelona", position: "CAM", performanceScore: 96 },
  { externalId: "soccer-legend-4", name: "Zinedine Zidane", sport: "EPL" as const, team: "Real Madrid", position: "CM", performanceScore: 97 },
  { externalId: "soccer-legend-5", name: "Thierry Henry", sport: "EPL" as const, team: "Arsenal", position: "ST", performanceScore: 95 },
  // Soccer 新生代
  { externalId: "soccer-new-1", name: "Lamine Yamal", sport: "EPL" as const, team: "FC Barcelona", position: "RW", performanceScore: 94 },
  { externalId: "soccer-new-2", name: "Florian Wirtz", sport: "EPL" as const, team: "Bayer Leverkusen", position: "CAM", performanceScore: 91 },
  // NBA 传奇
  { externalId: "nba-goat-1", name: "Michael Jordan", sport: "NBA" as const, team: "Chicago Bulls", position: "SG", performanceScore: 100 },
  { externalId: "nba-goat-2", name: "Magic Johnson", sport: "NBA" as const, team: "Los Angeles Lakers", position: "PG", performanceScore: 97 },
  { externalId: "nba-goat-3", name: "Larry Bird", sport: "NBA" as const, team: "Boston Celtics", position: "SF", performanceScore: 96 },
  // 历史传奇
  { externalId: "legend-1", name: "Wayne Gretzky", sport: "NHL" as const, team: "Edmonton Oilers", position: "C", performanceScore: 100 },
  { externalId: "legend-2", name: "Babe Ruth", sport: "MLB" as const, team: "New York Yankees", position: "RF", performanceScore: 100 },
  { externalId: "legend-3", name: "Wilt Chamberlain", sport: "NBA" as const, team: "Philadelphia 76ers", position: "C", performanceScore: 98 },
];

// ─── 初始化种子数据 ───────────────────────────────────────────────────────────

export async function seedDatabase(): Promise<{ playersSeeded: number; cardsSeeded: number }> {
  let playersSeeded = 0;
  let cardsSeeded = 0;

  for (const playerData of SEED_PLAYERS) {
    // 检查是否已存在
    const existing = await getPlayerByExternalId(playerData.externalId);
    if (existing) continue;

    // 插入球员
    await upsertPlayer({
      externalId: playerData.externalId,
      name: playerData.name,
      sport: playerData.sport,
      team: playerData.team,
      position: playerData.position,
      performanceScore: playerData.performanceScore,
      recentStats: {
        pts: 20 + Math.random() * 15,
        reb: 5 + Math.random() * 8,
        ast: 4 + Math.random() * 8,
        stl: 0.5 + Math.random() * 2,
        blk: 0.3 + Math.random() * 2,
        gamesPlayed: 10,
      },
      lastStatsUpdate: new Date(),
    });
    playersSeeded++;

    // 获取刚插入的球员 ID
    const player = await getPlayerByExternalId(playerData.externalId);
    if (!player) continue;

    // 生成球星卡数据
    const cardDataList = generateCardData(player.id, playerData.name, playerData.sport, playerData.performanceScore);

    for (const cardData of cardDataList) {
      const cardId = await upsertCard({
        playerId: player.id,
        playerName: playerData.name,
        sport: playerData.sport,
        year: cardData.year,
        brand: cardData.brand,
        set: cardData.set,
        parallel: cardData.parallel,
        grade: cardData.grade,
        currentPrice: cardData.currentPrice,
        avgPrice30d: cardData.avgPrice30d,
        priceChange7d: cardData.priceChange7d,
        dealScore: cardData.dealScore,
        isDealOpportunity: cardData.isDealOpportunity,
        marketSentiment: cardData.marketSentiment,
        lastPriceUpdate: new Date(),
      });

      if (cardId > 0) {
        // 插入价格历史
        for (const ph of cardData.priceHistory) {
          await insertPriceHistory({
            cardId,
            price: ph.price,
            source: ph.source as any,
            saleDate: ph.date,
          });
        }
        cardsSeeded++;
      }
    }
  }

  return { playersSeeded, cardsSeeded };
}
