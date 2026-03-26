import { SEED_PLAYERS, generateCardData } from "./sportsDataService";

const PLAYER_IMAGES: Record<string, string> = {
  // ── NBA (local static images from /players/) ─────────────────────────────
  "LeBron James":            "/players/lebron_james.png",
  "Stephen Curry":           "/players/stephen_curry.png",
  "Kevin Durant":            "/players/kevin_durant.png",
  "Giannis Antetokounmpo":   "/players/giannis.png",
  "Luka Doncic":             "/players/luka_doncic.png",
  "Nikola Jokic":            "/players/nikola_jokic.png",
  "Joel Embiid":             "/players/joel_embiid.png",
  "Jayson Tatum":            "/players/jayson_tatum.png",
  "Damian Lillard":          "/players/damian_lillard.png",
  "Anthony Davis":           "/players/anthony_davis.png",
  "Victor Wembanyama":       "/players/victor_wembanyama.png",
  "Tyrese Haliburton":       "/players/tyrese_haliburton.png",
  // ── NFL (local static images) ─────────────────────────────────────────────
  "Patrick Mahomes":         "/players/patrick_mahomes.png",
  "Josh Allen":              "/players/josh_allen.png",
  "Justin Jefferson":        "/players/justin_jefferson.png",
  "Travis Kelce":            "/players/travis_kelce.png",
  // ── MLB (local static images) ─────────────────────────────────────────────
  "Shohei Ohtani":           "/players/shohei_ohtani.png",
  "Mike Trout":              "/players/mike_trout.png",
  "Ronald Acuna Jr.":        "/players/ronald_acuna.png",
  // ── EPL / Soccer (local static images) ───────────────────────────────────
  "Erling Haaland":          "/players/erling_haaland.png",
  "Mohamed Salah":           "/players/mohamed_salah.png",
  "Bukayo Saka":             "/players/bukayo_saka.png",
  "Lionel Messi":            "/players/lionel_messi.png",
  "Kylian Mbappe":           "/players/kylian_mbappe.png",
  "Vinicius Junior":         "/players/vinicius_junior.png",
  // ── NBA 新生代 ────────────────────────────────────────────────────────────
  "Ja Morant":               "/players/ja_morant.png",
  "Zion Williamson":         "/players/zion_williamson.png",
  "Trae Young":              "/players/trae_young.png",
  "Devin Booker":            "/players/devin_booker.png",
  "Shai Gilgeous-Alexander": "/players/shai_gilgeous_alexander.png",
  "Anthony Edwards":         "/players/anthony_edwards.png",
  "Cade Cunningham":         "/players/cade_cunningham.png",
  "Evan Mobley":             "/players/evan_mobley.png",
  "Paolo Banchero":          "/players/paolo_banchero.png",
  // ── NFL 新生代 ────────────────────────────────────────────────────────────
  "Lamar Jackson":           "/players/lamar_jackson.png",
  "Justin Herbert":          "/players/justin_herbert.png",
  "Kyler Murray":            "/players/kyler_murray.png",
  // ── MLB 新生代 ────────────────────────────────────────────────────────────
  "Fernando Tatis Jr.":      "/players/fernando_tatis_jr.png",
  "Juan Soto":               "/players/juan_soto.png",
  "Julio Rodriguez":         "/players/julio_rodriguez.png",
  // ── Soccer 新生代 ─────────────────────────────────────────────────────────
  "Jude Bellingham":         "/players/jude_bellingham.png",
  "Pedri":                   "/players/pedri.png",
  "Neymar Jr.":              "/players/neymar_jr.png",
  // NBA 传奇
  "Kobe Bryant":             "/players/kobe_bryant.png",
  "Shaquille O'Neal":        "/players/shaquille_oneal.png",
  "Dwyane Wade":             "/players/dwyane_wade.png",
  "Tim Duncan":              "/players/tim_duncan.png",
  "Dirk Nowitzki":           "/players/dirk_nowitzki.png",
  "James Harden":            "/players/james_harden.png",
  "Kyrie Irving":            "/players/kyrie_irving.png",
  "Russell Westbrook":       "/players/russell_westbrook.png",
  "Kawhi Leonard":           "/players/kawhi_leonard.png",
  "Klay Thompson":            "/players/klay_thompson.png",
  "Draymond Green":          "/players/draymond_green.png",
  "Karl-Anthony Towns":      "/players/karl_anthony_towns.png",
  // NFL 传奇
  "Tom Brady":               "/players/tom_brady.png",
  "Aaron Rodgers":           "/players/aaron_rodgers.png",
  "Peyton Manning":          "/players/peyton_manning.png",
  "Jerry Rice":              "/players/jerry_rice.png",
  "Joe Burrow":              "/players/joe_burrow.png",
  // MLB 传奇
  "Ken Griffey Jr.":         "/players/ken_griffey_jr.png",
  "Derek Jeter":             "/players/derek_jeter.png",
  "Barry Bonds":             "/players/barry_bonds.png",
  "Bryce Harper":            "/players/bryce_harper.png",
  // Soccer 传奇
  "Lionel Messi":            "/players/lionel_messi.png",
  "Cristiano Ronaldo":       "/players/cristiano_ronaldo.png",
  // NHL
  "Connor McDavid":          "/players/connor_mcdavid.png",
  "Sidney Crosby":           "/players/sidney_crosby.png",
  "Alexander Ovechkin":      "/players/alexander_ovechkin.png",
  // Soccer 传奇
  "Ronaldinho":              "/players/ronaldinho.png",
  "Zinedine Zidane":         "/players/zinedine_zidane.png",
  "Thierry Henry":           "/players/thierry_henry.png",
  // Soccer 新生代
  "Lamine Yamal":            "/players/lamine_yamal.png",
  "Florian Wirtz":           "/players/florian_wirtz.png",
  // NBA 传奇
  "Michael Jordan":          "/players/michael_jordan.png",
  "Magic Johnson":           "/players/magic_johnson.png",
  "Larry Bird":              "/players/larry_bird.png",
  // 历史传奇
  "Wayne Gretzky":           "/players/wayne_gretzky.png",
  "Babe Ruth":               "/players/babe_ruth.png",
  "Wilt Chamberlain":        "/players/wilt_chamberlain.png",
};

// ── 球星卡卡面图片映射（每个球员 × 每个系列的真实卡面图片）────────────────────
// Key 格式: "球员名|年份|品牌关键词"
const CARD_IMAGES: Record<string, string> = {
  // ── LeBron James ─────────────────────────────────────────────────────────
  "LeBron James|2003|Topps Chrome":              "/cards/lebron_2003_topps_chrome.jpg",
  "LeBron James|2003|Topps":                     "/cards/lebron_2003_topps_chrome.jpg",
  "LeBron James|2003|Upper Deck Exquisite":      "/cards/lebron_2003_exquisite.jpg",
  "LeBron James|2020|Panini Prizm":              "/cards/lebron_2003_topps_chrome_2.jpg",
  "LeBron James|2021|Panini Select":             "/cards/lebron_2003_topps_chrome_2.jpg",
  // ── Stephen Curry ─────────────────────────────────────────────────────────
  "Stephen Curry|2009|Topps":                    "/cards/curry_2009_topps_chrome.jpg",
  "Stephen Curry|2009|Topps Chrome":             "/cards/curry_2009_topps_chrome.jpg",
  "Stephen Curry|2009|Panini Studio":            "/cards/curry_2009_topps_chrome.jpg",
  "Stephen Curry|2009|Bowman Chrome":            "/cards/curry_2009_topps_chrome.jpg",
  "Stephen Curry|2020|Panini Prizm":             "/cards/curry_2009_topps_chrome.jpg",
  // ── Kevin Durant ──────────────────────────────────────────────────────────
  "Kevin Durant|2007|Topps Chrome":              "/cards/durant_2007_topps_chrome_psa10.jpg",
  "Kevin Durant|2007|Bowman Chrome":             "/cards/durant_2007_topps_chrome.jpg",
  "Kevin Durant|2020|Panini Prizm":              "/cards/durant_2007_topps_chrome.jpg",
  // ── Giannis Antetokounmpo ─────────────────────────────────────────────────
  "Giannis Antetokounmpo|2013|Panini Prizm":     "/cards/giannis_2013_prizm_psa9.jpg",
  "Giannis Antetokounmpo|2020|Panini Prizm":     "/cards/giannis_2013_prizm_red.jpg",
  "Giannis Antetokounmpo|2013|Panini Select":    "/cards/giannis_2013_prizm.jpg",
  // ── Luka Doncic ───────────────────────────────────────────────────────────
  "Luka Doncic|2018|Panini Prizm":               "/cards/doncic_2018_prizm_silver.jpg",
  "Luka Doncic|2018|Panini National Treasures":  "/cards/doncic_2018_national_treasures.jpg",
  "Luka Doncic|2021|Panini Prizm":               "/cards/doncic_2018_prizm_silver_2.jpg",
  "Luka Doncic|2018|Panini Select":              "/cards/doncic_2018_prizm_silver_2.jpg",
  // ── Nikola Jokic ──────────────────────────────────────────────────────────
  "Nikola Jokic|2015|Panini Prizm":              "/cards/jokic_2015_prizm_psa9.jpg",
  "Nikola Jokic|2020|Panini Prizm":              "/cards/jokic_2015_prizm_amazon.jpg",
  "Nikola Jokic|2015|Panini Select":             "/cards/jokic_2015_prizm_2.jpg",
  // ── Joel Embiid ───────────────────────────────────────────────────────────
  "Joel Embiid|2014|Panini Prizm":               "/cards/embiid_2014_prizm_psa10.jpg",
  "Joel Embiid|2020|Panini Prizm":               "/cards/embiid_2014_prizm.jpg",
  // ── Jayson Tatum ──────────────────────────────────────────────────────────
  "Jayson Tatum|2017|Panini Prizm":              "/cards/tatum_2017_prizm_silver.jpg",
  "Jayson Tatum|2020|Panini Prizm":              "/cards/tatum_2017_prizm_blue.jpg",
  "Jayson Tatum|2017|Panini Select":             "/cards/tatum_2017_prizm_emergent.jpg",
  // ── Damian Lillard ────────────────────────────────────────────────────────
  "Damian Lillard|2012|Panini Prizm":            "/cards/lillard_2012_prizm.jpg",
  "Damian Lillard|2020|Panini Prizm":            "/cards/lillard_2012_prizm.jpg",
  // ── Anthony Davis ─────────────────────────────────────────────────────────
  "Anthony Davis|2012|Panini Prizm":             "/cards/davis_2012_prizm_sgc10.jpg",
  "Anthony Davis|2020|Panini Prizm":             "/cards/davis_2012_prizm.jpg",
  "Anthony Davis|2012|Panini Select":            "/cards/davis_2012_prizm.jpg",
  // ── Victor Wembanyama ─────────────────────────────────────────────────────
  "Victor Wembanyama|2023|Panini Prizm":         "/cards/wembanyama_2023_prizm.jpg",
  "Victor Wembanyama|2023|Panini National Treasures": "/cards/wembanyama_2023_national_treasures.jpg",
  "Victor Wembanyama|2024|Panini Prizm":         "/cards/wembanyama_2023_prizm_2.jpg",
  "Victor Wembanyama|2023|Panini Select":        "/cards/wembanyama_2023_nt_patch.jpg",
  "Victor Wembanyama|2023|Panini Mosaic":        "/cards/wembanyama_2023_prizm_2.jpg",
  // ── Tyrese Haliburton ─────────────────────────────────────────────────────
  "Tyrese Haliburton|2020|Panini Prizm":         "/cards/haliburton_2020_prizm.jpg",
  "Tyrese Haliburton|2021|Panini Prizm":         "/cards/haliburton_2020_prizm_green.jpg",
  "Tyrese Haliburton|2020|Panini Select":        "/cards/haliburton_2020_prizm_green.jpg",
  // ── Patrick Mahomes ───────────────────────────────────────────────────────
  "Patrick Mahomes|2017|Panini Prizm":           "/cards/mahomes_2017_prizm.jpg",
  "Patrick Mahomes|2017|Panini National Treasures": "/cards/mahomes_2017_prizm.jpg",
  "Patrick Mahomes|2017|Panini Select":          "/cards/mahomes_2017_prizm.jpg",
  "Patrick Mahomes|2020|Panini Prizm":           "/cards/mahomes_2017_prizm.jpg",
  // ── Josh Allen ────────────────────────────────────────────────────────────
  "Josh Allen|2018|Panini Prizm":                "/cards/allen_2018_prizm.jpg",
  "Josh Allen|2018|Panini National Treasures":   "/cards/allen_2018_prizm.jpg",
  "Josh Allen|2020|Panini Prizm":                "/cards/allen_2018_prizm.jpg",
  "Josh Allen|2018|Panini Select":               "/cards/allen_2018_prizm.jpg",
  // ── Justin Jefferson ──────────────────────────────────────────────────────
  "Justin Jefferson|2020|Panini Prizm":          "/cards/jefferson_2020_prizm.jpg",
  "Justin Jefferson|2021|Panini Prizm":          "/cards/jefferson_2020_prizm.jpg",
  "Justin Jefferson|2020|Panini Select":         "/cards/jefferson_2020_prizm.jpg",
  // ── Travis Kelce ──────────────────────────────────────────────────────────
  "Travis Kelce|2013|Panini Prizm":              "/cards/kelce_2013_prizm.jpg",
  "Travis Kelce|2020|Panini Prizm":              "/cards/kelce_2013_prizm_psa9.jpg",
  "Travis Kelce|2013|Panini Select":             "/cards/kelce_2013_prizm_psa9.jpg",
  // ── Shohei Ohtani ─────────────────────────────────────────────────────────
  "Shohei Ohtani|2018|Bowman Chrome":            "/cards/ohtani_2018_bowman_chrome.jpg",
  "Shohei Ohtani|2018|Topps Chrome Update":      "/cards/ohtani_2018_bowman_chrome.jpg",
  "Shohei Ohtani|2018|Topps Chrome":             "/cards/ohtani_2018_bowman_chrome.jpg",
  "Shohei Ohtani|2023|Topps Chrome":             "/cards/ohtani_2018_bowman_chrome.jpg",
  // ── Mike Trout ────────────────────────────────────────────────────────────
  "Mike Trout|2011|Topps":                       "/cards/trout_2011_topps_update.jpg",
  "Mike Trout|2011|Topps Chrome":                "/cards/trout_2011_topps_update.jpg",
  "Mike Trout|2011|Bowman Chrome":               "/cards/trout_2011_topps_update.jpg",
  "Mike Trout|2020|Panini Prizm":                "/cards/trout_2011_topps_update.jpg",
  // ── Ronald Acuna Jr. ──────────────────────────────────────────────────────
  "Ronald Acuna Jr.|2018|Topps Chrome":          "/cards/acuna_2018_topps_chrome.jpg",
  "Ronald Acuna Jr.|2018|Topps Chrome Update":   "/cards/acuna_2018_topps_chrome_auto.jpg",
  "Ronald Acuna Jr.|2020|Panini Prizm":          "/cards/acuna_2018_topps_chrome.jpg",
  "Ronald Acuna Jr.|2018|Bowman Chrome":         "/cards/acuna_2018_topps_chrome_auto.jpg",
  // ── Erling Haaland ────────────────────────────────────────────────────────
  "Erling Haaland|2021|Topps Chrome":            "/cards/haaland_2021_topps_chrome.jpg",
  "Erling Haaland|2022|Panini Prizm Premier League": "/cards/haaland_2021_topps_chrome.jpg",
  "Erling Haaland|2023|Topps Chrome":            "/cards/haaland_2021_topps_chrome.jpg",
  "Erling Haaland|2014|Panini Prizm World Cup":  "/cards/haaland_2021_topps_chrome.jpg",
  // ── Mohamed Salah ─────────────────────────────────────────────────────────
  "Mohamed Salah|2018|Panini Prizm World Cup":   "/cards/salah_2018_prizm_wc.jpg",
  "Mohamed Salah|2020|Panini Prizm Premier League": "/cards/salah_2018_prizm_wc.jpg",
  "Mohamed Salah|2022|Panini Prizm Premier League": "/cards/salah_2018_prizm_wc.jpg",
  "Mohamed Salah|2014|Panini Prizm World Cup":   "/cards/salah_2018_prizm_wc.jpg",
  // ── Bukayo Saka ───────────────────────────────────────────────────────────
  "Bukayo Saka|2020|Topps Chrome":               "/cards/saka_2020_topps_merlin.jpg",
  "Bukayo Saka|2022|Panini Prizm Premier League": "/cards/saka_2020_topps_merlin_2.jpg",
  "Bukayo Saka|2023|Topps Chrome":               "/cards/saka_2020_topps_merlin.jpg",
  // ── Kylian Mbappe ─────────────────────────────────────────────────────────
  "Kylian Mbappe|2018|Panini Prizm World Cup":   "/cards/mbappe_2018_prizm_wc.jpg",
  "Kylian Mbappe|2022|Panini Prizm World Cup":   "/cards/mbappe_2018_prizm_wc_2.jpg",
  "Kylian Mbappe|2020|Panini Prizm Ligue 1":     "/cards/mbappe_2018_prizm_wc_2.jpg",
  // ── Vinicius Junior ───────────────────────────────────────────────────────
  "Vinicius Junior|2018|Panini Donruss":         "/cards/vinicius_2018_donruss.jpg",
  "Vinicius Junior|2018|Panini Donruss Optic":   "/cards/vinicius_2018_donruss_optic.jpg",
  "Vinicius Junior|2022|Panini Prizm La Liga":   "/cards/vinicius_2018_donruss.jpg",
  "Vinicius Junior|2018|Panini Prizm World Cup": "/cards/vinicius_2018_donruss_optic.jpg",
  // ── Ja Morant ─────────────────────────────────────────────────────────────
  "Ja Morant|2019|Panini Prizm":                 "/cards/morant_2019_prizm_psa10.jpg",
  "Ja Morant|2019|Panini National Treasures":    "/cards/morant_2019_prizm_silver.jpg",
  "Ja Morant|2021|Panini Prizm":                 "/cards/morant_2019_prizm_psa10.jpg",
  "Ja Morant|2019|Panini Select":                "/cards/morant_2019_prizm_silver.jpg",
  // ── Zion Williamson ───────────────────────────────────────────────────────
  "Zion Williamson|2019|Panini National Treasures": "/cards/zion_2019_nt_auto.jpg",
  "Zion Williamson|2019|Panini Prizm":           "/cards/zion_2019_prizm.jpg",
  "Zion Williamson|2021|Panini Prizm":           "/cards/zion_2019_prizm.jpg",
  "Zion Williamson|2019|Panini Select":          "/cards/zion_2019_nt_auto.jpg",
  // ── Trae Young ────────────────────────────────────────────────────────────
  "Trae Young|2018|Panini Prizm":                "/cards/trae_2018_prizm_psa10.jpg",
  "Trae Young|2018|Panini National Treasures":   "/cards/trae_2018_prizm_silver.jpg",
  "Trae Young|2021|Panini Prizm":                "/cards/trae_2018_prizm_psa10.jpg",
  "Trae Young|2018|Panini Select":               "/cards/trae_2018_prizm_silver.jpg",
  // ── Devin Booker ──────────────────────────────────────────────────────────
  "Devin Booker|2015|Panini Prizm":              "/cards/booker_2015_prizm.jpg",
  "Devin Booker|2015|Panini Prizm Emergent":     "/cards/booker_2015_prizm_emergent.jpg",
  "Devin Booker|2020|Panini Prizm":              "/cards/booker_2015_prizm.jpg",
  "Devin Booker|2015|Panini Select":             "/cards/booker_2015_prizm_emergent.jpg",
  // ── Shai Gilgeous-Alexander ───────────────────────────────────────────────
  "Shai Gilgeous-Alexander|2018|Panini Prizm":   "/cards/sga_2018_prizm.jpg",
  "Shai Gilgeous-Alexander|2018|Panini Donruss": "/cards/sga_2018_prizm_green.jpg",
  "Shai Gilgeous-Alexander|2021|Panini Prizm":   "/cards/sga_2018_prizm.jpg",
  "Shai Gilgeous-Alexander|2018|Panini Select":  "/cards/sga_2018_prizm_green.jpg",
  // ── Anthony Edwards ───────────────────────────────────────────────────────
  "Anthony Edwards|2020|Panini Prizm":           "/cards/edwards_2020_prizm_psa9.jpg",
  "Anthony Edwards|2020|Panini National Treasures": "/cards/edwards_2020_nt_rpa.jpg",
  "Anthony Edwards|2022|Panini Prizm":           "/cards/edwards_2020_prizm_silver.jpg",
  "Anthony Edwards|2020|Panini Select":          "/cards/edwards_2020_prizm_green.jpg",
  // ── Cade Cunningham ───────────────────────────────────────────────────────
  "Cade Cunningham|2021|Panini Prizm":           "/cards/cunningham_2021_prizm.jpg",
  "Cade Cunningham|2021|Panini Prizm Choice":    "/cards/cunningham_2021_prizm_choice.jpg",
  "Cade Cunningham|2021|Panini National Treasures": "/cards/cunningham_2021_prizm_choice.jpg",
  "Cade Cunningham|2021|Panini Select":          "/cards/cunningham_2021_prizm.jpg",
  // ── Evan Mobley ───────────────────────────────────────────────────────────
  "Evan Mobley|2021|Panini National Treasures":  "/cards/mobley_2021_nt_rpa.jpg",
  "Evan Mobley|2021|Panini Prizm":               "/cards/mobley_2021_nt_dual.jpg",
  "Evan Mobley|2021|Panini Select":              "/cards/mobley_2021_nt_rpa.jpg",
  // ── Paolo Banchero ────────────────────────────────────────────────────────
  "Paolo Banchero|2022|Panini Prizm":            "/cards/banchero_2022_prizm.jpg",
  "Paolo Banchero|2022|Panini Prizm Draft":      "/cards/banchero_2022_prizm_orange.jpg",
  "Paolo Banchero|2022|Panini National Treasures": "/cards/banchero_2022_prizm_orange.jpg",
  "Paolo Banchero|2022|Panini Select":           "/cards/banchero_2022_prizm.jpg",
  // ── Lamar Jackson ─────────────────────────────────────────────────────────
  "Lamar Jackson|2018|Panini Prizm":             "/cards/jackson_2018_prizm_psa10.jpg",
  "Lamar Jackson|2018|Panini Prizm Silver":      "/cards/jackson_2018_prizm_silver.jpg",
  "Lamar Jackson|2020|Panini Prizm":             "/cards/jackson_2018_prizm_silver.jpg",
  "Lamar Jackson|2018|Panini Select":            "/cards/jackson_2018_prizm_psa10.jpg",
  // ── Justin Herbert ────────────────────────────────────────────────────────
  "Justin Herbert|2020|Panini National Treasures": "/cards/herbert_2020_nt_rpa.jpg",
  "Justin Herbert|2020|Panini Prizm":            "/cards/herbert_2020_prizm.jpg",
  "Justin Herbert|2021|Panini Prizm":            "/cards/herbert_2020_prizm.jpg",
  "Justin Herbert|2020|Panini Select":           "/cards/herbert_2020_nt_rpa.jpg",
  // ── Kyler Murray ──────────────────────────────────────────────────────────
  "Kyler Murray|2019|Panini Prizm":              "/cards/murray_2019_prizm.jpg",
  "Kyler Murray|2019|Panini Select":             "/cards/murray_2019_prizm.jpg",
  "Kyler Murray|2021|Panini Prizm":              "/cards/murray_2019_prizm.jpg",
  // ── Fernando Tatis Jr. ────────────────────────────────────────────────────
  "Fernando Tatis Jr.|2019|Topps Chrome":        "/cards/tatis_2019_topps_chrome.jpg",
  "Fernando Tatis Jr.|2019|Topps Chrome Auto":   "/cards/tatis_2019_topps_chrome_auto.jpg",
  "Fernando Tatis Jr.|2021|Topps Chrome":        "/cards/tatis_2019_topps_chrome.jpg",
  "Fernando Tatis Jr.|2019|Bowman Chrome":       "/cards/tatis_2019_topps_chrome_auto.jpg",
  // ── Juan Soto ─────────────────────────────────────────────────────────────
  "Juan Soto|2018|Topps Chrome":                 "/cards/soto_2018_topps_chrome.jpg",
  "Juan Soto|2018|Topps Update Chrome":          "/cards/soto_2018_topps_chrome_2.jpg",
  "Juan Soto|2021|Topps Chrome":                 "/cards/soto_2018_topps_chrome.jpg",
  "Juan Soto|2018|Bowman Chrome":                "/cards/soto_2018_topps_chrome_2.jpg",
  // ── Julio Rodriguez ───────────────────────────────────────────────────────
  "Julio Rodriguez|2022|Topps Chrome":           "/cards/jrod_2022_topps_chrome.jpg",
  "Julio Rodriguez|2022|Topps Chrome Auto":      "/cards/jrod_2022_topps_chrome_auto.jpg",
  "Julio Rodriguez|2023|Topps Chrome":           "/cards/jrod_2022_topps_chrome.jpg",
  "Julio Rodriguez|2022|Bowman Chrome":          "/cards/jrod_2022_topps_chrome_auto.jpg",
  // ── Jude Bellingham ───────────────────────────────────────────────────────
  "Jude Bellingham|2020|Topps Chrome UCL":       "/cards/bellingham_2020_topps_chrome.jpg",
  "Jude Bellingham|2020|Topps Chrome Bundesliga": "/cards/bellingham_2020_topps_chrome_bund.jpg",
  "Jude Bellingham|2022|Panini Prizm World Cup": "/cards/bellingham_2020_topps_chrome.jpg",
  "Jude Bellingham|2020|Topps Chrome":           "/cards/bellingham_2020_topps_chrome_bund.jpg",
  // ── Pedri ─────────────────────────────────────────────────────────────────
  "Pedri|2021|Topps Chrome UCL":                 "/cards/pedri_2021_topps_chrome.jpg",
  "Pedri|2021|Topps Chrome":                     "/cards/pedri_2021_topps_chrome_purple.jpg",
  "Pedri|2022|Panini Prizm World Cup":           "/cards/pedri_2021_topps_chrome.jpg",
  // ── Neymar Jr. ────────────────────────────────────────────────────────────
  "Neymar Jr.|2014|Panini Prizm World Cup":      "/cards/neymar_2014_prizm_wc.jpg",
  "Neymar Jr.|2018|Panini Prizm World Cup":      "/cards/neymar_2018_prizm_wc.jpg",
  "Neymar Jr.|2022|Panini Prizm World Cup":      "/cards/neymar_2018_prizm_wc.jpg",
  // ── Kobe Bryant ───────────────────────────────────────────────────────────
  "Kobe Bryant|1996|Topps Chrome":               "/cards/kobe_bryant_1996_chrome_psa9.jpg",
  "Kobe Bryant|2003|Topps Chrome":               "/cards/kobe_bryant_1996_chrome_psa9b.jpg",
  "Kobe Bryant|2007|Topps Chrome":               "/cards/kobe_bryant_1996_chrome_psa9.jpg",
  // ── Shaquille O'Neal ──────────────────────────────────────────────────────
  "Shaquille O'Neal|1992|Topps":                 "/cards/shaquille_oneal_1992_topps_bccg9.jpg",
  "Shaquille O'Neal|1992|Topps Archives":        "/cards/shaquille_oneal_1992_archives_gold.jpg",
  "Shaquille O'Neal|1993|Topps Finest":          "/cards/shaquille_oneal_1992_archives_gold.jpg",
  "Shaquille O'Neal|1996|Topps Chrome":          "/cards/shaquille_oneal_1992_topps_bccg9.jpg",
  // ── Dwyane Wade ───────────────────────────────────────────────────────────
  "Dwyane Wade|2003|Topps Chrome":               "/cards/dwyane_wade_2003_chrome_psa10.jpg",
  "Dwyane Wade|2003|Upper Deck Exquisite":       "/cards/dwyane_wade_2003_chrome_psa10b.jpg",
  "Dwyane Wade|2007|Topps Chrome":               "/cards/dwyane_wade_2003_chrome_psa10.jpg",
  // ── Tim Duncan ────────────────────────────────────────────────────────────
  "Tim Duncan|1997|Topps Chrome":                "/cards/tim_duncan_1997_chrome_base.jpg",
  "Tim Duncan|1997|Topps Finest":                "/cards/tim_duncan_1997_chrome_refractor.jpg",
  "Tim Duncan|2003|Topps Chrome":                "/cards/tim_duncan_1997_chrome_base.jpg",
  // ── Dirk Nowitzki ─────────────────────────────────────────────────────────
  "Dirk Nowitzki|1998|Topps Chrome":             "/cards/dirk_nowitzki_1998_chrome_base.jpg",
  "Dirk Nowitzki|1998|Topps Finest":             "/cards/dirk_nowitzki_1998_chrome_bccg10.jpg",
  "Dirk Nowitzki|2007|Topps Chrome":             "/cards/dirk_nowitzki_1998_chrome_base.jpg",
  // ── James Harden ──────────────────────────────────────────────────────────
  "James Harden|2009|Topps Chrome":              "/cards/james_harden_2009_chrome_bgs9.jpg",
  "James Harden|2009|Panini Prizm":              "/cards/james_harden_2009_chrome_bgs95.jpg",
  "James Harden|2020|Panini Prizm":              "/cards/james_harden_2009_chrome_bgs9.jpg",
  // ── Kyrie Irving ──────────────────────────────────────────────────────────
  "Kyrie Irving|2012|Panini Prizm":              "/cards/kyrie_irving_2012_prizm_psa9.jpg",
  "Kyrie Irving|2020|Panini Prizm":              "/cards/kyrie_irving_2012_prizm_psa10.jpg",
  // ── Russell Westbrook ─────────────────────────────────────────────────────
  "Russell Westbrook|2008|Topps Chrome":         "/cards/russell_westbrook_2008_chrome_psa9.jpg",
  "Russell Westbrook|2008|Panini Prizm":         "/cards/russell_westbrook_2008_chrome_refractor.png",
  "Russell Westbrook|2020|Panini Prizm":         "/cards/russell_westbrook_2008_chrome_psa9.jpg",
  // ── Kawhi Leonard ─────────────────────────────────────────────────────────
  "Kawhi Leonard|2011|SP Authentic":             "/cards/kawhi_leonard_2011_sp_authentic.jpg",
  "Kawhi Leonard|2014|Panini Prizm":             "/cards/kawhi_leonard_2014_prizm_blue.webp",
  "Kawhi Leonard|2011|Panini Prizm":             "/cards/kawhi_leonard_2011_sp_authentic.jpg",
  "Kawhi Leonard|2020|Panini Prizm":             "/cards/kawhi_leonard_2014_prizm_blue.webp",
  // ── Draymond Green ────────────────────────────────────────────────────────
  "Draymond Green|2012|Panini Prizm":            "/cards/draymond_green_2012_prizm_psa10.jpg",
  "Draymond Green|2020|Panini Prizm":            "/cards/draymond_green_2012_prizm_psa10.jpg",
  // ── Karl-Anthony Towns ────────────────────────────────────────────────────
  "Karl-Anthony Towns|2015|Panini Prizm Emergent": "/cards/karl_anthony_towns_2015_prizm_emergent.jpg",
  "Karl-Anthony Towns|2015|Panini Prizm":        "/cards/karl_anthony_towns_2015_prizm_emergent.jpg",
  "Karl-Anthony Towns|2020|Panini Prizm":        "/cards/karl_anthony_towns_2015_prizm_emergent.jpg",
  // ── Tom Brady ─────────────────────────────────────────────────────────────
  "Tom Brady|2000|Bowman Chrome":                "/cards/tom_brady_2000_bowman_chrome_base.jpg",
  "Tom Brady|2000|Topps Chrome":                 "/cards/tom_brady_2000_bowman_chrome_refractor.jpg",
  "Tom Brady|2005|Topps Chrome":                 "/cards/tom_brady_2000_bowman_chrome_base.jpg",
  // ── Aaron Rodgers ─────────────────────────────────────────────────────────
  "Aaron Rodgers|2005|Topps Chrome":             "/cards/aaron_rodgers_2005_chrome_psa9.jpg",
  "Aaron Rodgers|2020|Panini Prizm":             "/cards/aaron_rodgers_2005_chrome_auto.jpg",
  // ── Peyton Manning ────────────────────────────────────────────────────────
  "Peyton Manning|1998|Topps Chrome":            "/cards/peyton_manning_1998_chrome_base.jpg",
  "Peyton Manning|1998|Topps Finest":            "/cards/peyton_manning_1998_chrome_bgs9.jpg",
  // ── Jerry Rice ────────────────────────────────────────────────────────────
  "Jerry Rice|1986|Topps":                       "/cards/jerry_rice_1986_topps_psa10.jpg",
  "Jerry Rice|1990|Topps":                       "/cards/jerry_rice_1986_topps_psa10.jpg",
  // ── Joe Burrow ────────────────────────────────────────────────────────────
  "Joe Burrow|2020|Panini Prizm":                "/cards/joe_burrow_2020_prizm_base.jpg",
  "Joe Burrow|2020|Panini National Treasures":   "/cards/joe_burrow_2020_prizm_red_yellow.jpg",
  "Joe Burrow|2021|Panini Prizm":                "/cards/joe_burrow_2020_prizm_base.jpg",
  // ── Ken Griffey Jr. ───────────────────────────────────────────────────────
  "Ken Griffey Jr.|1989|Topps":                  "/cards/ken_griffey_jr_1989_topps_base.jpg",
  "Ken Griffey Jr.|1989|Bowman":                 "/cards/ken_griffey_jr_1989_topps_traded.jpg",
  "Ken Griffey Jr.|1990|Topps":                  "/cards/ken_griffey_jr_1989_topps_base.jpg",
  // ── Derek Jeter ───────────────────────────────────────────────────────────
  "Derek Jeter|1993|Bowman":                     "/cards/derek_jeter_1993_bowman_base.jpg",
  "Derek Jeter|1993|Topps":                      "/cards/derek_jeter_1993_bowman_psa10.jpg",
  "Derek Jeter|1994|Topps":                      "/cards/derek_jeter_1993_bowman_base.jpg",
  // ── Barry Bonds ───────────────────────────────────────────────────────────
  "Barry Bonds|1987|Topps":                      "/cards/barry_bonds_1987_topps_psa10.jpg",
  "Barry Bonds|1990|Topps":                      "/cards/barry_bonds_1987_topps_psa10.jpg",
  // ── Bryce Harper ──────────────────────────────────────────────────────────
  "Bryce Harper|2011|Bowman Chrome":             "/cards/bryce_harper_2011_bowman_chrome_psa10.jpg",
  "Bryce Harper|2012|Topps Chrome":              "/cards/bryce_harper_2011_bowman_chrome_refractor.jpg",
  // ── Lionel Messi ──────────────────────────────────────────────────────────
  "Lionel Messi|2014|Panini Prizm World Cup":    "/cards/lionel_messi_2018_prizm_base.jpg",
  "Lionel Messi|2004|Panini Megacracks":         "/cards/lionel_messi_2018_prizm_black_gold.jpg",
  "Lionel Messi|2022|Panini Prizm World Cup":    "/cards/lionel_messi_2018_prizm_base.jpg",
  "Lionel Messi|2018|Panini Prizm World Cup":    "/cards/lionel_messi_2018_prizm_black_gold.jpg",
  // ── Cristiano Ronaldo ─────────────────────────────────────────────────────
  "Cristiano Ronaldo|2018|Panini Prizm World Cup": "/cards/cristiano_ronaldo_2018_prizm_base.jpg",
  "Cristiano Ronaldo|2022|Panini Prizm World Cup": "/cards/cristiano_ronaldo_2018_prizm_scorers.jpg",
  "Cristiano Ronaldo|2014|Panini Prizm World Cup": "/cards/cristiano_ronaldo_2018_prizm_base.jpg",

  // ── Connor McDavid ────────────────────────────────────────────────────────
  "Connor McDavid|2015|Upper Deck":               "/cards/mcdavid_2015_young_guns.jpg",
  "Connor McDavid|2016|Upper Deck":               "/cards/mcdavid_2015_young_guns_psa.jpg",
  "Connor McDavid|2020|Upper Deck":               "/cards/mcdavid_2015_young_guns.jpg",
  // ── Sidney Crosby ─────────────────────────────────────────────────────────
  "Sidney Crosby|2005|Upper Deck":                "/cards/crosby_2005_young_guns.jpg",
  "Sidney Crosby|2010|Upper Deck":                "/cards/crosby_2005_young_guns.jpg",
  // ── Alexander Ovechkin ────────────────────────────────────────────────────
  "Alexander Ovechkin|2005|Upper Deck":           "/cards/ovechkin_2005_young_guns.jpg",
  "Alexander Ovechkin|2010|Upper Deck":           "/cards/ovechkin_2005_young_guns.jpg",

  // ── Ronaldinho ────────────────────────────────────────────────────────────
  "Ronaldinho|2004|Panini":                       "/cards/ronaldinho_2004_panini.jpg",
  "Ronaldinho|2006|Panini":                       "/cards/ronaldinho_2004_panini.jpg",
  "Ronaldinho|2004|Topps":                        "/cards/ronaldinho_2004_panini.jpg",
  // ── Zinedine Zidane ───────────────────────────────────────────────────────
  "Zinedine Zidane|2006|Panini":                  "/cards/zidane_2006_panini.jpg",
  "Zinedine Zidane|2002|Panini":                  "/cards/zidane_2006_panini.jpg",
  "Zinedine Zidane|1998|Panini":                  "/cards/zidane_2006_panini.jpg",
  // ── Thierry Henry ─────────────────────────────────────────────────────────
  "Thierry Henry|2006|Panini":                    "/cards/henry_2006_panini.jpg",
  "Thierry Henry|2003|Topps":                     "/cards/henry_2006_panini.jpg",
  "Thierry Henry|1998|Panini":                    "/cards/henry_2006_panini.jpg",

  // ── Lamine Yamal ─────────────────────────────────────────────────────────
  "Lamine Yamal|2024|Panini Select FIFA":         "/cards/yamal_2024_select_patch.jpg",
  "Lamine Yamal|2024|Topps Now":                  "/cards/yamal_2024_topps_now.jpg",
  "Lamine Yamal|2024|Panini Select La Liga":      "/cards/yamal_2024_select_gold.jpg",
  "Lamine Yamal|2024|Topps":                      "/cards/yamal_2024_topps_now.jpg",
  // ── Florian Wirtz ─────────────────────────────────────────────────────────
  "Florian Wirtz|2023|Topps Chrome UEFA":         "/cards/wirtz_2023_chrome.jpg",
  "Florian Wirtz|2022|Topps Chrome UEFA":         "/cards/wirtz_2022_chrome.jpg",
  "Florian Wirtz|2022|Topps Chrome":              "/cards/wirtz_2022_chrome.jpg",
  "Florian Wirtz|2024|Topps Chrome Bundesliga":   "/cards/wirtz_2023_chrome.jpg",

  // ── Michael Jordan ────────────────────────────────────────────────────────
  "Michael Jordan|1986|Fleer":                    "/cards/jordan_1986_fleer.jpg",
  "Michael Jordan|1997|Topps Chrome":             "/cards/jordan_1986_fleer.jpg",
  // ── Magic Johnson ─────────────────────────────────────────────────────────
  "Magic Johnson|1980|Topps":                     "/cards/magic_1980_topps.jpg",
  "Magic Johnson|1986|Fleer":                     "/cards/magic_1980_topps.jpg",
  // ── Larry Bird ────────────────────────────────────────────────────────────
  "Larry Bird|1980|Topps":                        "/cards/bird_1980_topps.jpg",
  "Larry Bird|1986|Fleer":                        "/cards/bird_1980_topps.jpg",

  // ── Wayne Gretzky ─────────────────────────────────────────────────────────
  "Wayne Gretzky|1979|O-Pee-Chee":               "/cards/gretzky_1979_opc.jpg",
  "Wayne Gretzky|1985|O-Pee-Chee":               "/cards/gretzky_1979_opc.jpg",
  // ── Babe Ruth ─────────────────────────────────────────────────────────────
  "Babe Ruth|1933|Goudey":                        "/cards/ruth_1933_goudey.jpg",
  "Babe Ruth|1934|Goudey":                        "/cards/ruth_1933_goudey.jpg",
  // ── Wilt Chamberlain ──────────────────────────────────────────────────────
  "Wilt Chamberlain|1961|Fleer":                  "/cards/chamberlain_1961_fleer.jpg",
  "Wilt Chamberlain|1969|Topps":                  "/cards/chamberlain_1961_fleer.jpg",
  // ── Klay Thompson ───────────────────────────────────────────────────────────────────────────────────
  "Klay Thompson|2012|Panini Prizm":              "/cards/klay_thompson_prizm_2012_psa10.jpg",
  "Klay Thompson|2012|National Treasures":        "/cards/klay_thompson_nt_2012_rpa_bgs95.jpg",
  "Klay Thompson|2023|Panini Prizm":              "/cards/klay_thompson_prizm_2023_white_ice.jpg",
  "Klay Thompson|2023|National Treasures":        "/cards/klay_thompson_nt_2023_clutch.jpg",
  "Klay Thompson|2024|Topps Chrome":              "/cards/klay_thompson_chrome_2024_green.jpg",
  "Klay Thompson|2024|Panini Select":             "/cards/klay_thompson_select_2024_white.jpg",
  "Klay Thompson|2020|Donruss Optic":             "/cards/klay_thompson_optic_2020_holo.jpg",
  "Klay Thompson|2021|Donruss Optic":             "/cards/klay_thompson_optic_2021_holo.jpg",
};

// 根据球员名、年份、品牌查找卡面图片
function getCardImage(playerName: string, year: number, brand: string): string {
  // 精确匹配
  const exactKey = `${playerName}|${year}|${brand}`;
  if (CARD_IMAGES[exactKey]) return CARD_IMAGES[exactKey];
  
  // 模糊匹配：只匹配球员名和年份
  const yearPrefix = `${playerName}|${year}|`;
  const yearMatch = Object.keys(CARD_IMAGES).find(k => k.startsWith(yearPrefix));
  if (yearMatch) return CARD_IMAGES[yearMatch];
  
  // 只匹配球员名（取第一张）
  const playerPrefix = `${playerName}|`;
  const playerMatch = Object.keys(CARD_IMAGES).find(k => k.startsWith(playerPrefix));
  if (playerMatch) return CARD_IMAGES[playerMatch];
  
  // 兜底：使用球员头像
  return PLAYER_IMAGES[playerName] || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=EEF4FF&color=1D6FEB&size=400&bold=true`;
}

export const MOCK_PLAYERS = SEED_PLAYERS.map((p, i) => ({
  id: i + 1,
  externalId: p.externalId,
  name: p.name,
  sport: p.sport,
  team: p.team,
  position: p.position,
  jerseyNumber: "0",
  imageUrl: PLAYER_IMAGES[p.name] || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&size=200`,
  performanceScore: p.performanceScore,
  recentStats: null,
  lastStatsUpdate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
}));

export const MOCK_CARDS: any[] = [];
export const MOCK_PRICE_HISTORY: any[] = [];
export const MOCK_PORTFOLIO_POSITIONS: any[] = [];
export const MOCK_WATCHLIST: any[] = [];
export const MOCK_NOTIFICATIONS: any[] = [];
export const MOCK_REPORTS: any[] = [];
export const MOCK_TREND_SNAPSHOTS: any[] = [];

let cardIdCounter = 1;
let phIdCounter = 1;

for (const player of MOCK_PLAYERS) {
  const cards = generateCardData(player.id, player.name, player.sport, player.performanceScore);
  
  for (const c of cards) {
    const cardId = cardIdCounter++;
    // 为每张卡片分配对应的真实卡面图片
    const cardImageUrl = getCardImage(player.name, c.year, c.brand);
    
    MOCK_CARDS.push({
      id: cardId,
      playerId: player.id,
      playerName: player.name,
      sport: player.sport,
      year: c.year,
      brand: c.brand,
      set: c.set,
      cardNumber: null,
      parallel: c.parallel,
      grade: c.grade,
      population: Math.floor(Math.random() * 500) + 10,
      imageUrl: cardImageUrl,
      currentPrice: c.currentPrice,
      avgPrice30d: c.avgPrice30d,
      priceChange7d: c.priceChange7d,
      dealScore: c.dealScore,
      isDealOpportunity: c.isDealOpportunity,
      marketSentiment: c.marketSentiment,
      populationTitle: "PSA Population Report",
      pop10Count: Math.floor(Math.random() * 200) + 1,
      shortTermTarget: c.currentPrice * (1 + (Math.random() * 0.15 + 0.05)),
      longTermTarget: c.currentPrice * (1 + (Math.random() * 0.4 + 0.2)),
      riskLevel: c.priceChange7d > 5 ? "Medium" : (c.priceChange7d < -5 ? "High" : "Low"),
      signal: c.priceChange7d > 5 ? "BUY" : (c.priceChange7d < -5 ? "WAIT" : "HOLD"),
      lastPriceUpdate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    for (const ph of c.priceHistory) {
      MOCK_PRICE_HISTORY.push({
        id: phIdCounter++,
        cardId: cardId,
        price: ph.price,
        source: ph.source,
        saleDate: ph.date,
        condition: c.grade,
        listingUrl: null,
        createdAt: new Date(),
      });
    }
  }
}


MOCK_PORTFOLIO_POSITIONS.push(
  { id: 1, userId: 1, cardId: 1, quantity: 1, averageCost: 1200, targetPrice: 1800, notes: "核心长期仓位", createdAt: new Date(), updatedAt: new Date() },
  { id: 2, userId: 1, cardId: 2, quantity: 2, averageCost: 350, targetPrice: 520, notes: "赛季催化观察", createdAt: new Date(), updatedAt: new Date() },
  { id: 3, userId: 1, cardId: 5, quantity: 1, averageCost: 680, targetPrice: 960, notes: "世界杯窗口期", createdAt: new Date(), updatedAt: new Date() }
);


MOCK_WATCHLIST.push({ id: 1, userId: 1, cardId: 1, playerId: null, alertPriceBelow: 1100, alertDealScoreAbove: 82, notes: "高端卡重点跟踪", createdAt: new Date(), updatedAt: new Date() });
MOCK_NOTIFICATIONS.push({ id: 1, userId: 1, type: "scan_complete", title: "示例通知", content: "欢迎使用 CardIQ，本地模式下也可以体验完整工作流。", cardId: null, isRead: false, createdAt: new Date() });
MOCK_REPORTS.push({ id: 1, userId: 1, title: "示例研究报告", sport: "NBA", content: "这是一个本地示例报告，用于展示 AI 报告列表与详情能力。", topDeals: [1, 2, 3], createdAt: new Date() });

MOCK_TREND_SNAPSHOTS.push(
  { id: 1, cardId: 1, trend: "bullish", confidence: 82, compositeScore: 84, source: "scan", notes: "初始强势样本", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) },
  { id: 2, cardId: 1, trend: "bullish", confidence: 86, compositeScore: 88, source: "scan", notes: "近期继续走强", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1) },
  { id: 3, cardId: 2, trend: "neutral", confidence: 70, compositeScore: 61, source: "scan", notes: "区间震荡", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) }
);
