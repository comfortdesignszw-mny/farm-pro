import { AdvisoryItem } from '../types';

export const SEED_ADVISORY_DATA: Omit<AdvisoryItem, 'id'>[] = [
  // 1. CHICKENS - LAYERS
  {
    topic: 'Chickens - Layers',
    category: 'species',
    language: 'en',
    title: 'Layers Management Guide (Egg Production)',
    summary: 'High egg yield management from day-old chick through 72-week laying cycle.',
    bulletPoints: [
      'Start: Day-old chicks or 18-week point-of-lay pullets.',
      'Brooding: Brooder with heat lamp at 32–35°C for first 6 weeks with fresh chick starter crumb.',
      'Housing: Layer house with clean nest boxes (1 box per 4 hens) ready by 18–20 weeks.',
      'Feed Progression: Chick Starter (0–6wks) → Grower Mash (6–18wks) → Layer Mash (18wks+, add oyster shell/calcium).',
      'Vaccination: Newcastle + Gumboro (IBD) vaccine in first 3 weeks; repeat Newcastle booster every 2–3 months.',
      'Water: Clean cool water at all times; never let water fonts run dry.',
      'Expected Yield: First eggs at 18–20 weeks; 250–300 eggs per hen per year.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&auto=format&fit=crop&q=60',
    keywords: ['layer', 'chicken', 'huku', 'inkukhu', 'eggs', 'mazai', 'amaqanda', 'newcastle', 'gumboro', 'brooder', 'mash']
  },
  {
    topic: 'Chickens - Layers',
    category: 'species',
    language: 'sn',
    title: 'Gwaro reKurera Huku dzeMazai (Layers)',
    summary: 'Maitirwo ehuku dzekukandira mazai kubva pachana kusvika pamavhiki makumi manomwe nemaviri.',
    bulletPoints: [
      'Kutanga: Mhuru dzezuva rimwe kana huku dzave pamavhiki 18 dzinoda kukandira.',
      'Kudziyisa (Brooding): Imba inodziya (32–35°C) kwemavhiki 6 ekutanga.',
      'Kudya: Starter (0–6 mavhiki) → Grower (6–18 mavhiki) → Layer Mash (mavhiki 18+ wowedzera calcium/calcite).',
      'Nhomba: Newcastle neGumboro mukati memavhiki matatu ekutanga; dzokorora Newcastle mwedzi 2–3 yega yega.',
      'Mbaura/Dendere: Isa matendere embaura 1 pamberi pehuku 4.',
      'Goho Rinotarisirwa: Kutanga kukandira pamavhiki 18–20; mazai 250–300 pahuku imwe pagore.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&auto=format&fit=crop&q=60',
    keywords: ['huku', 'mazai', 'chikafu', 'nhomba', 'newcastle', 'gumboro', 'layer', 'purazi']
  },
  {
    topic: 'Chickens - Layers',
    category: 'species',
    language: 'nd',
    title: 'Incwadi Yokuseluleko Yezinkukhu Zamaqanda (Layers)',
    summary: 'Indlela yokufuya izinkukhu zokubekela amaqanda kusukela kwabatshwana kusiya phambili.',
    bulletPoints: [
      'Ukuqala: Abantwana bezinsuku zokuqala kumbe izikhukhukazi zamaviki angu-18.',
      'Ukufudumala: Isakhiwo esilokushisa (32–35°C) kumaviki 6 okuqala.',
      'Ukudla: Starter (0–6 amaviki) → Grower (6–18 amaviki) → Layer Mash (amaviki 18+ engeza i-calcium).',
      'Imithi Lokugoma: Newcastle le-Gumboro emavikini 3 okuqala; phinda i-Newcastle njalo ngemva kwezinyanga 2–3.',
      'Izidleke Zokubekela: Faka isidleke esisodwa ezinkukwini ezi-4.',
      'Isivuno: Ukuqala ukubekela kumaviki 18–20; amaqanda 250–300 ngenkukhu ngomnyaka.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&auto=format&fit=crop&q=60',
    keywords: ['izinkukhu', 'inkukhu', 'amaqanda', 'ukudla', 'umuthi', 'newcastle', 'gumboro', 'layer']
  },

  // 2. BROILERS
  {
    topic: 'Broilers',
    category: 'species',
    language: 'en',
    title: 'Broilers Management Guide (Meat Chickens)',
    summary: 'Fast turn-around meat chicken cycle to market weight in 6–8 weeks.',
    bulletPoints: [
      'Start: Day-old broiler chicks from certified hatchery.',
      'Housing: Dry bedding/wood shavings (7–10cm deep); heat lamp for first 2 weeks.',
      'Feed: Broiler Starter crumbs (0–3wks) → Broiler Finisher pellets/mash (3wks to market).',
      'Health: Newcastle + Gumboro (IBD) schedule in first 3 weeks; clean bio-security at entrance.',
      'Ventilation: Ensure plenty of fresh air without direct cold drafts.',
      'Target Weight: 1.8–2.5kg live weight in 6 to 8 weeks.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&auto=format&fit=crop&q=60',
    keywords: ['broiler', 'meat', 'chicken', 'finisher', 'starter', 'gumboro', 'newcastle', 'weight']
  },
  {
    topic: 'Broilers',
    category: 'species',
    language: 'sn',
    title: 'Gwaro reKurera Huku dzeNyama (Broilers)',
    summary: 'Kurera huku dzenyama dzinotengeswa mumavhiki matanhatu kusvika masere.',
    bulletPoints: [
      'Kutanga: Mhuru dzezuva rimwe chete dzerudzi rweBroiler.',
      'Imba: Waridza mashavhings akachena pasi; vadziyise kwemavhiki maviri ekutanga.',
      'Kudya: Starter (mavhiki 0–3) → Finisher (mavhiki 3 kusvika pakutengesa).',
      'Nhomba: Newcastle neGumboro mumavhiki matatu ekutanga.',
      'Kurema: Dzinofanira kusvika 1.8–2.5kg mukati memavhiki matanhatu.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&auto=format&fit=crop&q=60',
    keywords: ['broiler', 'nyama', 'huku', 'chikafu', 'finisher', 'starter', 'nhomba']
  },

  // 3. DUCKS
  {
    topic: 'Ducks',
    category: 'species',
    language: 'en',
    title: 'Ducks Management Guide',
    summary: 'Hardy waterfowls with low mortality, high foraging ability, and multi-purpose meat/eggs.',
    bulletPoints: [
      'Start: Day-old ducklings; much hardier and faster feathered than chickens.',
      'Housing: Good ventilation; dry straw bedding; access to swimming water is beneficial but not strictly mandatory.',
      'Feed: Duck starter (avoid medicated chick feed containing coccidiostats toxic to ducks) → Grower/forage.',
      'Foraging: Ducks forage snails, weeds, insects, reducing farm feed costs by 30–40%.',
      'Health: Watch for viral enteritis in crowded pens; deworm periodically.',
      'Yield: Meat breeds reach 2.8–3.2kg in 7–8 weeks; egg breeds lay 250–300 eggs/year.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1555852095-64e7428df0fa?w=800&auto=format&fit=crop&q=60',
    keywords: ['duck', 'dhadha', 'idada', 'duckling', 'meat', 'forage', 'eggs']
  },

  // 4. PIGS
  {
    topic: 'Pigs',
    category: 'species',
    language: 'en',
    title: 'Pigs Management & Piggery Guide',
    summary: 'Intensive commercial or smallholder pig breeding and fattening.',
    bulletPoints: [
      'Start: Weaners (8 weeks, 15–20kg) or quality breeding gilts/boars (Large White, Landrace, Duroc).',
      'Reproduction: 114-day gestation period ("3 months, 3 weeks, 3 days"); 8–12 piglets per litter.',
      'Feeding: Creep feed (piglets) → Pig Grower (30–60kg) → Pig Finisher (60–100kg). Provide ad-lib clean water via nipple drinkers.',
      'Health: Vaccinate against Erysipelas & Parvovirus; inject iron into piglets at day 3; deworm every 3–4 months.',
      'Housing: Dry concrete pens with slope for drainage and dunging area.',
      'Market Weight: Reach 90–100kg baconer/porker weight at 5–6 months.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&auto=format&fit=crop&q=60',
    keywords: ['pig', 'pigs', 'nguruve', 'ingulube', 'piggery', 'weaner', 'iron', 'erysipelas', 'pork']
  },
  {
    topic: 'Pigs',
    category: 'species',
    language: 'sn',
    title: 'Gwaro reKurera Nguruve (Piggery)',
    summary: 'Kuchengeta nekukodza nguruve kusvika padanho rekutengesa.',
    bulletPoints: [
      'Kutanga: Nguruve dzekuyamwiswa (mavhiki 8, 15–20kg) kana mhuka dzekuberekesa.',
      'Kubereka: Nhumbu yemazuva 114 (mwedzi 3, mavhiki 3, mazuva 3); vana 8–12.',
      'Kudya: Creep feed → Pig Grower → Pig Finisher. Mvura yakachena nguva dzose.',
      'Utano: Nhomba yeErysipelas neParvovirus; jekiseni resimbi (iron) kumucheche pazuva rechitatu; mushonga wemakonye.',
      'Kurema: 90–100kg mumwedzi 5–6.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&auto=format&fit=crop&q=60',
    keywords: ['nguruve', 'chikafu', 'iron', 'mushonga', 'vana', 'pig', 'piggery']
  },

  // 5. HORSES
  {
    topic: 'Horses',
    category: 'species',
    language: 'en',
    title: 'Horses & Draft Animals Management Guide',
    summary: 'Care for draft power, ploughing, cart transport, and working farm horses.',
    bulletPoints: [
      'Start: Young trained stock or breeding mare/stallion.',
      'Gestation: ~11 months (340 days); single foal.',
      'Nutrition: Good pasture/grass hay as foundation (1.5–2% bodyweight daily); crushed oats/maize bran if working heavy ploughs.',
      'Health & Care: Regular hoof trimming every 6–8 weeks; annual tetanus vaccination; routine deworming.',
      'Use: Excellent sustainable draft power for ploughing, weeding, and farm cart haulage.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=60',
    keywords: ['horse', 'bhiza', 'ibhiza', 'draft', 'plough', 'hoof', 'tetanus', 'forage']
  },

  // 6. CATTLE - BEEF
  {
    topic: 'Cattle - Beef',
    category: 'species',
    language: 'en',
    title: 'Beef Cattle Management Guide',
    summary: 'Pasture management, tick control, and fattening for quality beef herds.',
    bulletPoints: [
      'Breeds: Mashona, Nguni, Brahman, Tuli, Simmental crosses.',
      'Reproduction: 283 days (~9 months) gestation; 1 calf per year target.',
      'Feeding: Grazing/veld pasture; winter protein/mineral lick supplements during the dry season.',
      'Health: Strict weekly tick dipping/spraying to prevent tick-borne Theileriosis (January disease), Redwater, and Heartwater.',
      'Vaccinations: Annual Anthrax, Blackleg, Botulism, and Foot-and-Mouth (where zoned).',
      'Market Target: 450–500kg live weight at 18–24 months.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=800&auto=format&fit=crop&q=60',
    keywords: ['cattle', 'beef', 'mombe', 'izinkomo', 'tick', 'dipping', 'anthrax', 'blackleg', 'veld', 'mashona', 'nguni']
  },
  {
    topic: 'Cattle - Beef',
    category: 'species',
    language: 'sn',
    title: 'Gwaro reKupfuya Mombe dzeNyama (Beef Cattle)',
    summary: 'Kuchengeta nekudzivirira hosha pamombe dzenyama.',
    bulletPoints: [
      'Mhando: Mashona, Tuli, Brahman, Nguni.',
      'Kubereka: Nhumbu yemwedzi 9 (mazuva 283).',
      'Kudya: Mafuro; wedzera salt lick/choko mukati mechando.',
      'Utano neZvirwere: Dhivha kana kupfuritsa mushonga wezvikwekwe svondo roga roga (January disease, Redwater).',
      'Nhomba: Blackleg, Anthrax, Botulism.',
      'Kukura: 450–500kg pamwedzi 18–24.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?w=800&auto=format&fit=crop&q=60',
    keywords: ['mombe', 'dhivha', 'zvikwekwe', 'nhomba', 'blackleg', 'anthrax', 'mafuro', 'cattle']
  },

  // 7. CATTLE - DAIRY
  {
    topic: 'Cattle - Dairy',
    category: 'species',
    language: 'en',
    title: 'Dairy Cattle Management Guide',
    summary: 'Maximizing clean, hygienic milk production and udder health.',
    bulletPoints: [
      'Breeds: Holstein Friesian, Jersey, Dairy Swiss, or Hardy Crossbreds.',
      'Lactation: ~305-day lactation cycle; aim for 12–13 month calving interval.',
      'Feeding: High protein dairy meal, silage, Rhodes grass, and unlimited clean drinking water (60–100L daily).',
      'Udder Hygiene: Pre-dip and post-dip teats with iodine; strip test first milk streams to detect Mastitis early.',
      'Yield: 5–10 Litres/day for local crossbreds; 20–30+ Litres/day for pure dairy breeds with intensive feed.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&auto=format&fit=crop&q=60',
    keywords: ['dairy', 'milk', 'mukaka', 'uchago', 'cow', 'mombe', 'mastitis', 'friesian', 'jersey', 'udder']
  },

  // 8. GOATS
  {
    topic: 'Goats',
    category: 'species',
    language: 'en',
    title: 'Goat Husbandry Guide (Meat & Dairy)',
    summary: 'Low-cost, high-resilience small stock farming in dryland and mixed zones.',
    bulletPoints: [
      'Breeds: Boer goat, Kalahari Red, Matabele, Mashona indigenous, Saanen (dairy).',
      'Reproduction: 150 days (~5 months) gestation; twins and triplets common.',
      'Feeding: Excellent browsers on tree leaves, shrubs, and acacia pods; supplement with grain/salts during dry months.',
      'Housing: Elevated slatted floor shelters protect against dampness and foot rot.',
      'Health: Regular deworming (goats have very low internal worm resistance); vaccinate against PPR (Peste des Petits Ruminants); trim hooves.',
      'Yield: Meat breeds reach 30–40kg at 6–9 months; dairy goats give 2–4L milk daily.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?w=800&auto=format&fit=crop&q=60',
    keywords: ['goat', 'goats', 'mbudzi', 'imbuzi', 'boer', 'matabele', 'deworming', 'ppr', 'footrot', 'browse']
  },
  {
    topic: 'Goats',
    category: 'species',
    language: 'sn',
    title: 'Gwaro reKurera Mbudzi',
    summary: 'Kuchengeta nekupfuya mbudzi dzenyama kana dzemukaka.',
    bulletPoints: [
      'Mhando: Mbudzi dzechivanhu (Mashona, Matabele), Boer, Kalahari Red.',
      'Kubereka: Nhumbu yemwedzi 5 (mazuva 150); dzinowanzo berekana maviri.',
      'Kudya: Mashizha emiti, makwenzi, nemasanzu; wedzera munyu.',
      'Imba: Tanga danga rine matanda akakwirira kudzivirira mwando nemakonye.',
      'Utano: Nguva nenguva ipai mushonga wemakonye emudumbu; chengetedzai tsoka dzisaoze (foot rot).',
      'Goho: Kurema 30–40kg mumwedzi 6–9.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?w=800&auto=format&fit=crop&q=60',
    keywords: ['mbudzi', 'makonye', 'danga', 'mashizha', 'boer', 'utano', 'goat']
  },

  // 9. SHEEP
  {
    topic: 'Sheep',
    category: 'species',
    language: 'en',
    title: 'Sheep Management Guide (Dorper & Indigenous)',
    summary: 'Pasture grazing, lambing, and parasite management.',
    bulletPoints: [
      'Breeds: Dorper, Damara, Blackhead Persian, Merino (wool).',
      'Gestation: ~150 days (5 months); hardy lamb survival.',
      'Feeding: Primarily low-ground grass pasture grazing; crop residue grazing after harvest.',
      'Health: Control blue-tongue, enterotoxaemia (pulpy kidney) with annual vaccination; rigorous internal parasite deworming; foot bath for foot rot prevention.',
      'Yield: Meat lambs reach prime market weight (35–45kg) in 4–8 months.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=800&auto=format&fit=crop&q=60',
    keywords: ['sheep', 'makwai', 'izimvu', 'dorper', 'lamb', 'damara', 'pulpy kidney', 'pasture']
  },

  // 10. MAIZE (CROP)
  {
    topic: 'Maize',
    category: 'crop',
    language: 'en',
    title: 'Maize (Corn) Production Guide',
    summary: 'Staged agronomy guide for high-yielding maize crops.',
    bulletPoints: [
      'Planting: Plant with first effective rains (30–40mm); spacing 75–90cm between rows, 25cm in row (approx. 44,000–50,000 plants/ha).',
      'Basal Fertilizer: Apply Compound D (or 7:14:7) at 200–300kg/ha at planting in the furrow, covered before dropping seed.',
      'Weeding: Keep field strictly weed-free during the first 6 weeks of vegetative growth.',
      'Top Dressing: Apply Ammonium Nitrate (AN 34.5% N) or Urea at 150–250kg/ha when maize reaches knee-height (4–6 weeks after emergence).',
      'Pest Alert: Scout for Fall Armyworm in the whorl weekly; spray Chlorantraniliprole, Emamectin benzoate, or neem spray if detected.',
      'Harvest: When black layer forms at base of grain and cob droops; dry to 12.5% moisture for safe storage.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&auto=format&fit=crop&q=60',
    keywords: ['maize', 'corn', 'chibage', 'umbila', 'fertilizer', 'compound d', 'ammonium nitrate', 'armyworm', 'planting']
  },
  {
    topic: 'Maize',
    category: 'crop',
    language: 'sn',
    title: 'Gwaro reKurima Chibage',
    summary: 'Mazano ekurima chibage chinopa goho rakawanda.',
    bulletPoints: [
      'Kudyara: Dyara kana mvura yekutanga yanaya; simba 75–90cm mumitsara, 25cm mugomba.',
      'Fetereza yekutanga: Isa Compound D panguva yekudyara (200–300kg/ha).',
      'Kusakura: Sakura sora rose mumavhiki matanhatu ekutanga.',
      'Fetereza yepamusoro (Top Dressing): Isa Ammonium Nitrate (AN) chibage chava pamabvi (mavhiki 4–6).',
      'Zvipfukuto: Chenjererai Mhundu (Fall Armyworm); pfiritsai mushonga pakarepo kana muchechete.',
      'Kukohwa: Kohwa kana chibage chaoma zvakanaka kusvika pamwando we 12.5% kudzivirira kuora mudura.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&auto=format&fit=crop&q=60',
    keywords: ['chibage', 'fetereza', 'compound d', 'an', 'mhundu', 'goho', 'munda', 'maize']
  },

  // 11. GROUNDNUTS
  {
    topic: 'Groundnuts',
    category: 'crop',
    language: 'en',
    title: 'Groundnuts (Peanuts) Production Guide',
    summary: 'Soil preparation, gypsum application, and harvesting tips for high-oil nuts.',
    bulletPoints: [
      'Soil: Sandy loam to light soils with loose structure for easy peg penetration.',
      'Planting: Plant early at 45cm row spacing and 7–10cm seed spacing.',
      'Fertilizer: Low nitrogen need (fixes own N); apply Single Superphosphate (SSP) at planting.',
      'Crucial Step: Apply Gypsum (Calcium Sulphate) at 200–300kg/ha at flowering/pegging to prevent empty shells (pops).',
      'Harvesting: Lift plants when 70–80% of inner pod shells show dark brown markings; dry in field stacks/A-frames before stripping.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&auto=format&fit=crop&q=60',
    keywords: ['groundnuts', 'peanuts', 'nzungu', 'amazambane', 'gypsum', 'pops', 'pegging', 'ssp']
  },

  // 12. TOMATOES
  {
    topic: 'Tomatoes',
    category: 'crop',
    language: 'en',
    title: 'Tomato Production & Pest Guide',
    summary: 'High-value horticulture, staking, and blight prevention.',
    bulletPoints: [
      'Nursery: Grow seedlings in trays for 4–5 weeks; harden off 1 week before transplanting.',
      'Fertilizer: Compound C (or 6:18:15) at planting + Potassium Nitrate / CAN during fruit set.',
      'Staking & Trellising: Stake or string tomatoes to improve air circulation and prevent soil-borne rot.',
      'Blight Prevention: Spray preventative Copper Oxychloride / Mancozeb before heavy rains or humid spells.',
      'Pest Control: Watch for Tuta Absoluta and Red Spider Mites; use sticky traps and targeted spray.',
      'Harvest: Pick at "breaker stage" (pink star on blossom end) for transport to markets.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800&auto=format&fit=crop&q=60',
    keywords: ['tomato', 'tomatoes', 'madomasi', 'amatamatisi', 'blight', 'tuta', 'copper', 'staking']
  },

  // 13. SOYBEANS
  {
    topic: 'Soybeans',
    category: 'crop',
    language: 'en',
    title: 'Soybeans Production Guide',
    summary: 'Nitrogen-fixing grain legume with high commercial demand.',
    bulletPoints: [
      'Inoculation: Inoculate seed with Bradyrhizobium japonicum bacteria before planting for maximum nitrogen fixation.',
      'Planting: Spacing 45cm rows, 5cm in row; do not plant deeper than 3–4cm.',
      'Fertilizer: Apply Compound L or Superphosphate; no top-dressing nitrogen required if well-nodulated.',
      'Weed Control: Critical to control weeds in first 35 days until dense canopy forms.',
      'Harvest: Harvest promptly when leaves drop and pods rattle, before shattering.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?w=800&auto=format&fit=crop&q=60',
    keywords: ['soybean', 'soybeans', 'soya', 'inoculant', 'rhizobium', 'legume', 'pods']
  },

  // 14. CABBAGE
  {
    topic: 'Cabbage',
    category: 'crop',
    language: 'en',
    title: 'Cabbage & Brassica Production Guide',
    summary: 'High-density brassica heads, aphid management, and heading nutrition.',
    bulletPoints: [
      'Nursery: Grow in seedling trays for 4–5 weeks until 4–5 true leaves appear.',
      'Spacing: 50–60cm between rows, 40–50cm in row (approx. 33,000–40,000 plants/ha).',
      'Fertilizer: Compound S or C at planting (400–600kg/ha); top dress with AN/CAN at 3 weeks and 6 weeks after transplanting.',
      'Irrigation: Consistent moisture prevents head splitting; irrigate 30–35mm weekly.',
      'Pest Control: Scout for Diamondback Moth (DBM) larvae and Aphids; use biological Bt (Bacillus thuringiensis) or systemic insecticides.',
      'Harvest: Cut firm, solid heads with 2–3 wrapper leaves in early morning.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=800&auto=format&fit=crop&q=60',
    keywords: ['cabbage', 'muriwo', 'ikhabishi', 'brassica', 'dbm', 'aphids', 'head']
  },
  {
    topic: 'Cabbage',
    category: 'crop',
    language: 'sn',
    title: 'Gwaro reKurima Makabichi (Cabbage)',
    summary: 'Mazano ekurima makabichi anovhara misoro mikuru yakasimba.',
    bulletPoints: [
      'Mbesa: Chengetedza munhedzi kwemavhiki 4–5 kusvika pamasizha 4–5.',
      'Kudyara: Simbisa 50–60cm pamitsara, 45cm pakati pezvirimwa.',
      'Fetereza: Isa Compound C pakusima; wedzera AN mushure memavhiki 3 ne 6.',
      'Kudiridza: Diridzai zvakaenzana kudzivirira kutsemuka kwemusoro wekabichi.',
      'Zvipfukuto: Chenjerai Makonye nezvipfukuto zvakaita semapundu (Aphids/DBM).',
      'Kukohwa: Cheka makabichi akasimba zvakanaka mangwanani-ngwanani.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=800&auto=format&fit=crop&q=60',
    keywords: ['makabichi', 'cabbage', 'muriwo', 'fetereza', 'makonye', 'nhedzi']
  },

  // 15. SORGHUM
  {
    topic: 'Sorghum',
    category: 'crop',
    language: 'en',
    title: 'Sorghum (Traditional Grain) Guide',
    summary: 'Drought-tolerant climate-smart cereal for low-rainfall and arid zones.',
    bulletPoints: [
      'Planting: Plant at 75cm row spacing, 10–15cm in row; seeding depth 2.5–3cm in fine seedbed.',
      'Drought Resilience: Requires 30–40% less water than maize, excellent for low rainfall regions IV & V.',
      'Fertility: Moderate basal Compound D (150–200kg/ha) + light top dressing AN at 4–5 weeks.',
      'Pest Management: Watch for Shoot Fly at seedling stage and Stalk Borer in the stem; protect heads from Quelea birds near maturity.',
      'Harvest: Harvest when grain hardens and moisture drops below 13%.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1628172901332-9df7fa364024?w=800&auto=format&fit=crop&q=60',
    keywords: ['sorghum', 'mapfunde', 'amabele', 'drought', 'cereal', 'quelea', 'traditional']
  },

  // 16. POTATOES
  {
    topic: 'Potatoes',
    category: 'crop',
    language: 'en',
    title: 'Irish Potato Production Guide',
    summary: 'Tuber initiation, ridging, and late blight prevention for high yields.',
    bulletPoints: [
      'Seed Tubers: Use certified disease-free, well-sprouted seed potatoes (35–55mm size).',
      'Planting: 75–90cm between ridges, 30cm in row; depth 10–12cm below ridge crest.',
      'Fertilizer: High Potassium & Phosphorus demand (Compound C or S at 800–1200kg/ha).',
      'Earthing Up / Ridging: Ridge soil around stems at 15–20cm height and repeat before flowering to shield tubers from sunlight and tuber moth.',
      'Blight Management: Strict preventative fungicide spraying (Mancozeb/Cymoxanil) against Late Blight during wet periods.',
      'Harvest: Cut foliage (haulm killing) 10–14 days before digging to harden skins.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&auto=format&fit=crop&q=60',
    keywords: ['potato', 'potatoes', 'mbambaira', 'magwere', 'amatapula', 'ridging', 'blight', 'tubers']
  },

  // 17. WHEAT
  {
    topic: 'Wheat',
    category: 'crop',
    language: 'en',
    title: 'Winter Wheat Irrigation Guide',
    summary: 'Commercial winter cereal crop under overhead/centre-pivot irrigation.',
    bulletPoints: [
      'Planting Window: 1 May to 25 May in highveld; seeding rate 100–120kg/ha at 15–20cm row spacing.',
      'Fertilizer: Basal Compound D at 350–450kg/ha + split top-dressing AN (300–400kg/ha total) at tillering and stem elongation.',
      'Irrigation Scheduling: Total water requirement 450–550mm over winter season; never allow stress at flowering/grain-fill.',
      'Disease & Weeds: Apply broadleaf and grass herbicides early; scout for Stem/Stripe Rust and Powdery Mildew.',
      'Harvest: Combine harvest when grain reaches 12–13% moisture.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=60',
    keywords: ['wheat', 'gorosi', 'ingqoloyi', 'winter', 'irrigation', 'pivot', 'rust']
  },

  // 18. FINE BEANS
  {
    topic: 'Fine Beans',
    category: 'crop',
    language: 'en',
    title: 'Fine Beans (French Beans & Sugar Beans) Guide',
    summary: 'High-value export and local market legume, short cycle 45–60 days.',
    bulletPoints: [
      'Planting: Sow directly at 45–50cm row spacing, 7–10cm seed spacing (depth 2.5–3cm).',
      'Soil & Nutrition: Well-drained sandy loam pH 6.0–6.8; apply Compound C or D at 200–300kg/ha; light CAN top dress at flowering.',
      'Water: Sensitive to moisture stress at flowering and pod set; regular light drip/overhead irrigation.',
      'Pest & Diseases: Watch for Bean Stem Maggot at emergence (dress seed), Rust, and Anthracnose.',
      'Harvesting: Pick every 2–3 days when pods are young, tender, and straight before seeds bulge.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800&auto=format&fit=crop&q=60',
    keywords: ['beans', 'fine beans', 'sugar beans', 'nyemba', 'bhinzi', 'indumba', 'french beans', 'pods']
  },
  {
    topic: 'Fine Beans',
    category: 'crop',
    language: 'sn',
    title: 'Gwaro reKurima Bhinzi (Fine Beans & Sugar Beans)',
    summary: 'Kudyara nekukohwa bhinzi dzinotengesa nekukasira mumazuva 50–65.',
    bulletPoints: [
      'Kudyara: Dyara 45–50cm mumitsara, 8–10cm mugomba pamasendimita 3 pasi.',
      'Fetereza: Isa Compound D panguva yekudyara; bhinzi inozvigadzirira nitrogen.',
      'Kudiridza: Inoda mvura yakakwana panguva yekutumbuka maruva nemuchero.',
      'Utano: Dzivirirai zvirwere zvakadai seRust neAnthracnose nekupuriza mushonga wakanaka.',
      'Kukohwa: Kohwa mazuva maviri ega ega bhinzi ichiri nyoro isati yaoma.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800&auto=format&fit=crop&q=60',
    keywords: ['bhinzi', 'beans', 'sugar beans', 'nyemba', 'fetereza', 'munda']
  },

  // 19. VEGETABLES (LEAFY GREENS)
  {
    topic: 'Vegetables',
    category: 'crop',
    language: 'en',
    title: 'Leafy Vegetables (Rape, Covo, Spinach, Tsunga) Guide',
    summary: 'Continuous harvest horticultural crops for rapid daily farm cash flow.',
    bulletPoints: [
      'Nursery & Planting: Sow seeds in nursery beds or propagate Covo via stem cuttings; transplant spaced 30x30cm.',
      'Soil & Organic Matter: Enrich beds with compost/well-rotted cattle/chicken manure (10–20 tonnes/ha) + Compound C.',
      'Fertilizer Top Dress: Apply CAN or Ammonium Nitrate dissolved or banded every 2–3 weeks after each major leaf harvest.',
      'Pest Management: Handpick caterpillars or use neem oil/cypermethrin; wash leaves thoroughly and adhere to safe withholding periods.',
      'Harvesting: Pick outer mature leaves regularly to stimulate new inner vegetative flush.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=60',
    keywords: ['vegetables', 'rape', 'covo', 'spinach', 'tsunga', 'muriwo', 'imbida', 'leafy', 'greens', 'horticulture']
  },
  {
    topic: 'Vegetables',
    category: 'crop',
    language: 'sn',
    title: 'Gwaro reKurima Muriwo (Rape, Covo, Tsunga, Spinach)',
    summary: 'Kuchengeta nekukohwa muriwo wemashizha unopa mari yezuva nezuva.',
    bulletPoints: [
      'Kudyara: Simbisa mbesa dzemuriwo kana matavi eCovo pamasendimita 30x30cm.',
      'Mupfudze: Isa mupfudze wakaora wemombe kana wehuku wakawanda mumibhedha.',
      'Fetereza: Isa AN kana CAN nguva nenguva mushure mekukohwa mashizha.',
      'Zvipfukuto: Chenjerai Makonye; shandisai mushonga weNeem kana mushonga unokodzera usati wavakukohwa.',
      'Kukohwa: Kohwa mashizha ekunze asara mukati achikura zvakare.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=60',
    keywords: ['muriwo', 'rape', 'covo', 'spinach', 'tsunga', 'mupfudze', 'fetereza']
  },

  // 20. FRUITS
  {
    topic: 'Fruits',
    category: 'crop',
    language: 'en',
    title: 'Fruit Orchard Management (Citrus, Mango, Avocado, Banana)',
    summary: 'Orchard establishment, pruning, fruit fly trapping, and irrigation.',
    bulletPoints: [
      'Establishment: Dig 60x60x60cm planting holes; mix topsoil with 1 bucket compost/manure and 200g Compound C/Single Superphosphate.',
      'Spacing: Citrus 5x5m, Mango 8x8m, Avocado 7x7m, Bananas 3x3m.',
      'Pruning & Training: Prune dead/diseased branches and water shoots annually to allow sunlight penetration into canopy.',
      'Fruit Fly & Disease Control: Hang methyl eugenol pheromone traps; spray copper fungicides against Anthracnose and Citrus Black Spot.',
      'Mulching: Maintain a 10cm dry organic mulch ring around the tree drip line (avoid direct trunk contact) to conserve soil moisture.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=60',
    keywords: ['fruit', 'fruits', 'citrus', 'mango', 'avocado', 'banana', 'michero', 'izithelo', 'orchard', 'pruning', 'fruit fly']
  },
  {
    topic: 'Fruits',
    category: 'crop',
    language: 'sn',
    title: 'Gwaro reKuchengeta Michero (Orchard)',
    summary: 'Kudyara nekuchengeta miti yemichero (Maranjisi, Maovhadhi, Manhanga, Mabhanana).',
    bulletPoints: [
      'Gomba reKudyara: Chera gomba 60x60x60cm; sanganisa ivhu remusoro nebhakiti remupfudze neCompound C.',
      'Kupfimbika: Kuchekerera matavi akaoma nemapazi asina basa kuti zuva ripinde.',
      'Mvura nemubhedha (Mulch): Waridza uswa hwakaoma pasi pemuti kudzivirira kupwa kwemvura.',
      'Zvipfukuto: Chenjerai nhunzi dzemichero (Fruit Fly) nekuteya misungo.',
      'Kukohwa: Kohwa michero panguva yakakodzera isati yadonha yega.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=60',
    keywords: ['michero', 'maranjisi', 'maovhadhi', 'mabhanana', 'munda', 'orchard']
  },

  // 21. OTHER / CUSTOM CROPS
  {
    topic: 'Other',
    category: 'crop',
    language: 'en',
    title: 'Specialty & Custom Crop Management Guide',
    summary: 'Universal agronomy best practices for diverse and mixed specialty crops.',
    bulletPoints: [
      'Soil Testing: Determine soil pH (optimum 5.5–6.5) and organic matter before planting.',
      'Crop Rotation: Rotate grass/cereal crops with legumes and brassicas to break pest/disease cycles and restore nitrogen.',
      'Water & Mulch: Conserve water using drip lines and organic mulching around root zones.',
      'IPM (Integrated Pest Management): Scout fields twice weekly; combine biological controls, crop hygiene, and targeted safe sprays.',
      'Record Keeping: Log planting dates, fertilizer batches, and harvest yields meticulously in Farm Pro.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=60',
    keywords: ['crop', 'crops', 'farming', 'rotation', 'soil', 'fertilizer', 'agronomy', 'zvirimwa', 'izitshalo']
  },

  // 22. EMERGENCY DIAGNOSTIC & VACCINATION GUIDES (Offline Decision Support)
  {
    topic: 'Fall Armyworm Diagnosis',
    category: 'crop',
    language: 'en',
    title: 'Fall Armyworm (FAW) Diagnosis & Control',
    summary: 'Caterpillars boring into maize funnels causing ragged leaf holes and sawdust-like frass.',
    bulletPoints: [
      'Observation: Ragged shot-holes in whorl leaves with moist sawdust-like caterpillar droppings.',
      'Immediate Action: Scout 20 consecutive plants in 5 spots; treat if >10% of vegetative crop shows fresh damage.',
      'Organic / Cultural: Put fine dry wood ash or dry sand directly into the funnel whorl of each plant; spray aqueous Neem leaf extract.',
      'Chemical Control: Emamectin Benzoate 5% SG (5g/20L water) or Chlorantraniliprole in early morning or late afternoon when larvae are active.',
      'Safety: Wear protective gloves and mask; observe 14-day withholding period before green mealie harvest.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=60',
    keywords: ['armyworm', 'caterpillar', 'maize', 'corn', 'funnel', 'holes', 'sawdust', 'mupfukidzi', 'chibage', 'emamectin', 'ash']
  },
  {
    topic: 'Fall Armyworm Diagnosis',
    category: 'crop',
    language: 'sn',
    title: 'Kurapa Mupfukidzi weChibage (Fall Armyworm)',
    summary: 'Makonye anodya mukati memwoyo wechibage achisiya madonhwe akaita semadota kana mashavhings.',
    bulletPoints: [
      'Zvinoonekwa: Mashizha akabooka maburi makuru ane tsvina yemakonye mukati memwoyo.',
      'Chirango chekukurumidza: Isa madota akachena kana jecha rakaoma mumwoyo wechibage chimwe nechimwe.',
      'Mushonga weChivanhu: Muto weNeem unovava unodzinga makonye.',
      'Mushonga weChirungu: Emamectin Benzoate kana Belt/Ampligo; pfapfaidza mangwanani-ngwanani kana zuva ravira.',
      'Chenjedzo: Pfekai magirovhosi nemasiki; mirai mazuva 14 musati madya chibage chinyoro.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&auto=format&fit=crop&q=60',
    keywords: ['mupfukidzi', 'makonye', 'chibage', 'madota', 'mwoyo', 'armyworm', 'fetereza']
  },
  {
    topic: 'Tomato Blight Diagnosis',
    category: 'crop',
    language: 'en',
    title: 'Tomato Late Blight & Early Blight Diagnosis',
    summary: 'Dark water-soaked brown rotting patches on tomato leaves, stems, and fruits during wet or humid weather.',
    bulletPoints: [
      'Observation: Rapidly spreading dark brown lesions with pale green margins on leaves and brown sunken rot on fruits.',
      'Immediate Action: Prune off and burn severely infected lower leaves immediately; never leave diseased trash in the field.',
      'Cultural Control: Stop overhead irrigation (water at root base only); increase spacing for air circulation; stake plants.',
      'Chemical Spray: Mancozeb 80% WP (preventative) or Copper Oxychloride 85% WP; use Metalaxyl + Mancozeb if already established.',
      'Safety: Respect 7-day withholding harvest interval after spraying fungicides.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=800&auto=format&fit=crop&q=60',
    keywords: ['blight', 'tomato', 'matomatisi', 'brown', 'spots', 'rot', 'mancozeb', 'copper', 'leaves', 'dying']
  },
  {
    topic: 'Newcastle Disease Diagnosis',
    category: 'species',
    language: 'en',
    title: 'Newcastle Disease (NCD) in Poultry',
    summary: 'Highly contagious viral disease causing twisted necks, respiratory gasping, green watery diarrhea, and sudden high flock mortality.',
    bulletPoints: [
      'Observation: Greenish watery droppings, coughing/gasping, torticollis (twisted neck/circling), sudden flock death.',
      'Emergency Action: IMMEDIATELY ISOLATE all healthy birds from sick ones; disinfect footbaths; bury or incinerate dead birds.',
      'Escalation: Escalate to local AGRITEX / Veterinary Department immediately — highly contagious notifiable disease.',
      'Treatment: No chemical cure for viral NCD. Provide broad-spectrum antibiotics (Oxytetracycline soluble) + multivitamins to prevent secondary bacterial infection in survivors.',
      'Prevention: Vaccinate Day 1 (Hitchner B1 eye drop), Week 3 (LaSota drinking water), and repeat booster every 3 months.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&auto=format&fit=crop&q=60',
    keywords: ['newcastle', 'chicken', 'twisted neck', 'green droppings', 'dying', 'huku', 'chirwere', 'lasota', 'vaccine', 'mortality']
  },
  {
    topic: 'Newcastle Disease Diagnosis',
    category: 'species',
    language: 'sn',
    title: 'Chirwere cheNewcastle muHuku',
    summary: 'Chirwere chinopararira nekukurumidza chinonyonganisa mutsipa, manyoka akasvibira, nekufa kwechimbichimbi.',
    bulletPoints: [
      'Zvinoonekwa: Mutsipa unomonyoroka, huku inokoshora, manyoka egirinhi, nekufa kwechimbichimbi.',
      'Kukurumidza Kuita: Putsanisa huku dzinorwara nedzisiri kurwara pakarepo; viga dzafa.',
      'Kutaura neAGRITEX: Chizivisai mudhumeni wekurima kana veVeterinary Services nekukurumidza.',
      'Kurapa: Hakuna mushonga unorapa hutachiona uhu, asi ipai mavhitamini neOxytetracycline mumvura kuchengetedza dzichiri mhenyu.',
      'Nhomba: Nhomba yeLaSota mumvura pamavhiki matatu uye dzokororai mushure memwedzi mitatu.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&auto=format&fit=crop&q=60',
    keywords: ['newcastle', 'huku', 'mutsipa', 'manyoka', 'chirwere', 'lasota', 'nhomba', 'chitsvuku']
  },
  {
    topic: 'Broiler 6-Week Vaccine Protocol',
    category: 'species',
    language: 'en',
    title: 'Standard 6-Week Broiler Vaccination & Health Protocol',
    summary: 'Essential staged schedule to guarantee 95%+ livability and rapid growth.',
    bulletPoints: [
      'Day 1–3: Stress pack / Multivitamins + Glucose in clean drinking water; warmth at 33°C.',
      'Day 7: Gumboro (Infectious Bursal Disease - IBD) 1st dose in dechlorinated water.',
      'Day 14: Newcastle Disease (LaSota) vaccine in drinking water with skim milk stabilizer.',
      'Day 18–21: Gumboro (IBD) 2nd booster dose in drinking water.',
      'Week 4–5: Preventative deworming or Coccidiostat flush (Amprolium / ESB3) if bedding becomes wet.',
      'Week 6–7: Clean fresh water only; observe withdrawal period before marketing/slaughter.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=800&auto=format&fit=crop&q=60',
    keywords: ['vaccination', 'broiler', 'schedule', 'gumboro', 'newcastle', 'lasota', 'vitamins', 'protocol', 'chickens']
  }
];

