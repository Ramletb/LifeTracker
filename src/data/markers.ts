import type { MarkerDef, SystemId } from '../types'

export const SYSTEMS: { id: SystemId; name: string; blurb: string }[] = [
  { id: 'cardio', name: 'Cardiovascular', blurb: 'Lipids & vascular risk' },
  { id: 'metabolic', name: 'Metabolic', blurb: 'Glucose & insulin control' },
  { id: 'inflammation', name: 'Inflammation', blurb: 'Systemic inflammation' },
  { id: 'liver', name: 'Liver', blurb: 'Hepatic function' },
  { id: 'kidney', name: 'Kidney', blurb: 'Renal function & electrolytes' },
  { id: 'thyroid', name: 'Thyroid', blurb: 'Thyroid axis' },
  { id: 'blood', name: 'Blood', blurb: 'CBC & iron status' },
  { id: 'micro', name: 'Micronutrients', blurb: 'Vitamins, minerals & hormones' }
]

export const systemName = (id: SystemId) =>
  SYSTEMS.find((s) => s.id === id)?.name ?? id

/**
 * General adult reference ranges ("std") and tighter optimal targets ("opt").
 * Ranges vary by lab, sex and age — treat these as sensible defaults for
 * trend-tracking, not as clinical cutoffs.
 */
export const MARKERS: MarkerDef[] = [
  // ── Cardiovascular ────────────────────────────────────────────────
  {
    id: 'total_chol',
    name: 'Total cholesterol',
    short: 'Total chol',
    unit: 'mg/dL',
    category: 'cardio',
    std: { low: 125, high: 200 },
    opt: { low: 140, high: 180 },
    decimals: 0,
    desc: 'Sum of cholesterol carried in all lipoprotein particles. Less informative on its own than LDL-C, non-HDL-C or ApoB.',
    aliases: ['cholesterol', 'cholesterol total', 'total cholesterol']
  },
  {
    id: 'ldl',
    name: 'LDL cholesterol',
    short: 'LDL-C',
    unit: 'mg/dL',
    category: 'cardio',
    std: { high: 130 },
    opt: { high: 80 },
    decimals: 0,
    desc: 'Cholesterol carried in LDL particles — a primary causal driver of atherosclerosis. Lower is generally better for heart health.',
    advice:
      'Swap saturated fat for unsaturated (olive oil, nuts, fish), add 10g+ of soluble fiber daily (oats, beans, psyllium), and keep training. If it stays elevated, discuss lipid-lowering options with your clinician.',
    aliases: ['ldl-c', 'ldl chol', 'ldl cholesterol', 'ldl calculated', 'ldl cholesterol calc']
  },
  {
    id: 'hdl',
    name: 'HDL cholesterol',
    short: 'HDL-C',
    unit: 'mg/dL',
    category: 'cardio',
    std: { low: 40 },
    opt: { low: 50, high: 100 },
    decimals: 0,
    desc: 'Cholesterol in HDL particles. Low values track with metabolic dysfunction; moderate-to-high values are favorable.',
    advice:
      'Regular aerobic exercise, weight management and not smoking are the reliable levers for low HDL.',
    aliases: ['hdl-c', 'hdl chol', 'hdl cholesterol']
  },
  {
    id: 'trig',
    name: 'Triglycerides',
    short: 'Trig',
    unit: 'mg/dL',
    category: 'cardio',
    std: { high: 150 },
    opt: { high: 90 },
    decimals: 0,
    desc: 'Fat circulating in the blood, very responsive to diet. High fasting values signal insulin resistance and raise cardiovascular risk.',
    advice:
      'Cut refined carbs, sugar and alcohol; add omega-3-rich fish; fasted morning walks help. Triglycerides respond to lifestyle within weeks.',
    aliases: ['triglyceride', 'tg', 'trigs']
  },
  {
    id: 'non_hdl',
    name: 'Non-HDL cholesterol',
    short: 'Non-HDL',
    unit: 'mg/dL',
    category: 'cardio',
    std: { high: 160 },
    opt: { high: 100 },
    decimals: 0,
    desc: 'Total minus HDL — captures cholesterol in all atherogenic particles. A better risk marker than LDL-C alone.',
    aliases: ['non hdl', 'non-hdl-c', 'non hdl cholesterol']
  },
  {
    id: 'apob',
    name: 'Apolipoprotein B',
    short: 'ApoB',
    unit: 'mg/dL',
    category: 'cardio',
    std: { high: 120 },
    opt: { high: 80 },
    decimals: 0,
    desc: 'One ApoB per atherogenic particle, so this counts the particles that drive plaque. Many consider it the single best routine lipid marker.',
    advice:
      'Same levers as LDL-C: dietary fat quality, soluble fiber, body composition. Persistent elevation is worth a medication conversation with your clinician.',
    aliases: ['apo b', 'apolipoprotein b', 'apob100', 'apo-b']
  },
  {
    id: 'lpa',
    name: 'Lipoprotein(a)',
    short: 'Lp(a)',
    unit: 'nmol/L',
    category: 'cardio',
    std: { high: 75 },
    opt: { high: 75 },
    decimals: 0,
    desc: 'A genetically determined LDL-like particle that independently raises cardiovascular risk. Mostly fixed for life — measure at least once.',
    advice:
      'Lp(a) barely moves with lifestyle. If elevated, the play is to be aggressive about every other risk factor (ApoB, blood pressure, glucose) with your clinician.',
    aliases: ['lp(a)', 'lipoprotein a', 'lipoprotein (a)', 'lpa nmol/l']
  },
  {
    id: 'homocysteine',
    name: 'Homocysteine',
    short: 'Hcy',
    unit: 'µmol/L',
    category: 'cardio',
    std: { low: 4, high: 15 },
    opt: { low: 5, high: 9 },
    decimals: 1,
    desc: 'An amino-acid byproduct cleared by B-vitamin-dependent pathways. Elevated levels associate with vascular and cognitive risk.',
    advice:
      'Check B12 and folate status — supplementing B12, folate and B6 usually lowers homocysteine.',
    aliases: ['hcy']
  },
  // ── Metabolic ─────────────────────────────────────────────────────
  {
    id: 'glucose',
    name: 'Fasting glucose',
    short: 'Glucose',
    unit: 'mg/dL',
    category: 'metabolic',
    std: { low: 70, high: 99 },
    opt: { low: 72, high: 90 },
    decimals: 0,
    desc: 'Blood sugar after an overnight fast. Values creeping into the 90s often precede insulin resistance by years.',
    advice:
      'Walk 10–15 minutes after meals, front-load protein and fiber, keep refined carbs for around training, and protect sleep — poor sleep alone raises fasting glucose.',
    aliases: ['fasting glucose', 'glucose fasting', 'blood glucose', 'fbg']
  },
  {
    id: 'hba1c',
    name: 'HbA1c',
    short: 'HbA1c',
    unit: '%',
    category: 'metabolic',
    std: { low: 4.0, high: 5.6 },
    opt: { low: 4.8, high: 5.3 },
    decimals: 1,
    desc: 'Three-month average blood glucose, read from sugar bound to hemoglobin. The workhorse marker of long-term glucose control.',
    advice:
      'Same levers as fasting glucose, applied consistently: post-meal movement, resistance training to grow glucose-hungry muscle, and fewer liquid carbs.',
    aliases: ['a1c', 'hemoglobin a1c', 'glycated hemoglobin', 'hgba1c']
  },
  {
    id: 'insulin',
    name: 'Fasting insulin',
    short: 'Insulin',
    unit: 'µIU/mL',
    category: 'metabolic',
    std: { low: 2, high: 20 },
    opt: { low: 2, high: 7 },
    decimals: 1,
    desc: 'How hard the pancreas works to hold glucose steady. Rises long before glucose does — an early-warning marker for insulin resistance.',
    advice:
      'Build muscle, manage weight, and space meals so insulin gets time low. Pairs with fasting glucose to compute HOMA-IR.',
    aliases: ['fasting insulin', 'insulin fasting']
  },
  {
    id: 'uric',
    name: 'Uric acid',
    short: 'Uric acid',
    unit: 'mg/dL',
    category: 'metabolic',
    std: { low: 3.5, high: 7.2 },
    opt: { low: 3.5, high: 6.0 },
    decimals: 1,
    desc: 'A purine-metabolism byproduct linked to gout, hypertension and metabolic syndrome at higher levels.',
    advice:
      'Cut fructose-sweetened drinks and alcohol (especially beer); hydrate well. Some high-purine foods matter less than sugar for most people.',
    aliases: ['uric acid', 'urate']
  },
  // ── Inflammation ──────────────────────────────────────────────────
  {
    id: 'hscrp',
    name: 'hs-CRP',
    short: 'hs-CRP',
    unit: 'mg/L',
    category: 'inflammation',
    std: { high: 3.0 },
    opt: { high: 1.0 },
    decimals: 2,
    desc: 'High-sensitivity C-reactive protein — a general marker of systemic inflammation and an independent cardiovascular risk signal.',
    advice:
      'Body-fat reduction, regular zone-2 cardio, omega-3s, sleep and oral health all lower chronic CRP. Re-test when not ill — infections spike it.',
    aliases: ['crp', 'c-reactive protein', 'hs crp', 'high sensitivity crp', 'c reactive protein']
  },
  {
    id: 'esr',
    name: 'ESR',
    short: 'ESR',
    unit: 'mm/hr',
    category: 'inflammation',
    std: { high: 15 },
    opt: { high: 10 },
    decimals: 0,
    desc: 'Erythrocyte sedimentation rate — a slower-moving, less specific inflammation marker that complements hs-CRP.',
    aliases: ['sed rate', 'erythrocyte sedimentation rate']
  },
  // ── Liver ─────────────────────────────────────────────────────────
  {
    id: 'alt',
    name: 'ALT',
    short: 'ALT',
    unit: 'U/L',
    category: 'liver',
    std: { low: 7, high: 56 },
    opt: { low: 10, high: 30 },
    decimals: 0,
    desc: 'The most liver-specific routine enzyme. Values in the upper-normal range often reflect early fatty liver.',
    advice:
      'Reduce alcohol and liquid sugar, lose visceral fat — ALT tracks liver fat closely and improves within months of lifestyle change.',
    aliases: ['alanine aminotransferase', 'sgpt', 'alt (sgpt)']
  },
  {
    id: 'ast',
    name: 'AST',
    short: 'AST',
    unit: 'U/L',
    category: 'liver',
    std: { low: 10, high: 40 },
    opt: { low: 10, high: 26 },
    decimals: 0,
    desc: 'A liver enzyme also found in muscle — hard training can raise it transiently, so interpret alongside ALT.',
    aliases: ['aspartate aminotransferase', 'sgot', 'ast (sgot)']
  },
  {
    id: 'ggt',
    name: 'GGT',
    short: 'GGT',
    unit: 'U/L',
    category: 'liver',
    std: { low: 8, high: 61 },
    opt: { low: 8, high: 30 },
    decimals: 0,
    desc: 'Sensitive to alcohol intake and oxidative stress on the liver. A useful early canary alongside ALT.',
    advice: 'Most responsive to cutting alcohol; coffee is mildly protective.',
    aliases: ['gamma gt', 'gamma-glutamyl transferase', 'gamma glutamyl transferase']
  },
  {
    id: 'alp',
    name: 'Alkaline phosphatase',
    short: 'ALP',
    unit: 'U/L',
    category: 'liver',
    std: { low: 44, high: 121 },
    opt: { low: 44, high: 110 },
    decimals: 0,
    desc: 'An enzyme from liver and bone. Isolated changes are usually followed up with more specific tests.',
    aliases: ['alk phos', 'alkaline phosphatase']
  },
  {
    id: 'bilirubin',
    name: 'Total bilirubin',
    short: 'Bilirubin',
    unit: 'mg/dL',
    category: 'liver',
    std: { low: 0.2, high: 1.2 },
    opt: { low: 0.3, high: 1.2 },
    decimals: 1,
    desc: 'A breakdown product of red blood cells cleared by the liver. Mild benign elevation (Gilbert syndrome) is common.',
    aliases: ['bilirubin total', 'total bilirubin', 'tbili']
  },
  {
    id: 'albumin',
    name: 'Albumin',
    short: 'Albumin',
    unit: 'g/dL',
    category: 'liver',
    std: { low: 3.5, high: 5.0 },
    opt: { low: 4.0, high: 5.0 },
    decimals: 1,
    desc: 'The main blood protein, made by the liver — reflects liver synthetic function and overall nutritional state.',
    aliases: ['serum albumin']
  },
  // ── Kidney ────────────────────────────────────────────────────────
  {
    id: 'creatinine',
    name: 'Creatinine',
    short: 'Creatinine',
    unit: 'mg/dL',
    category: 'kidney',
    std: { low: 0.7, high: 1.3 },
    opt: { low: 0.7, high: 1.2 },
    decimals: 2,
    desc: 'A muscle byproduct filtered by the kidneys. Higher muscle mass (and creatine supplements) raise it without kidney harm.',
    aliases: ['serum creatinine']
  },
  {
    id: 'egfr',
    name: 'eGFR',
    short: 'eGFR',
    unit: 'mL/min/1.73m²',
    category: 'kidney',
    std: { low: 60 },
    opt: { low: 90 },
    decimals: 0,
    desc: 'Estimated filtration rate of the kidneys, derived from creatinine. Above 90 is normal; declines slowly with age.',
    advice:
      'Blood pressure and glucose control are the two big protectors of kidney function; hydrate and go easy on NSAIDs.',
    aliases: ['estimated gfr', 'gfr', 'egfr non-african american']
  },
  {
    id: 'bun',
    name: 'BUN',
    short: 'BUN',
    unit: 'mg/dL',
    category: 'kidney',
    std: { low: 7, high: 20 },
    opt: { low: 8, high: 20 },
    decimals: 0,
    desc: 'Blood urea nitrogen — influenced by protein intake, hydration and kidney function.',
    aliases: ['blood urea nitrogen', 'urea nitrogen']
  },
  {
    id: 'cystatin_c',
    name: 'Cystatin C',
    short: 'Cystatin C',
    unit: 'mg/L',
    category: 'kidney',
    std: { low: 0.6, high: 1.0 },
    opt: { low: 0.6, high: 0.95 },
    decimals: 2,
    desc: 'A kidney filtration marker independent of muscle mass — useful when creatinine is skewed by training or creatine.',
    aliases: ['cystatin-c']
  },
  {
    id: 'sodium',
    name: 'Sodium',
    short: 'Na',
    unit: 'mmol/L',
    category: 'kidney',
    std: { low: 135, high: 145 },
    opt: { low: 137, high: 143 },
    decimals: 0,
    desc: 'The main blood electrolyte, tightly regulated by the kidneys.',
    aliases: ['na', 'serum sodium']
  },
  {
    id: 'potassium',
    name: 'Potassium',
    short: 'K',
    unit: 'mmol/L',
    category: 'kidney',
    std: { low: 3.5, high: 5.2 },
    opt: { low: 3.8, high: 4.8 },
    decimals: 1,
    desc: 'An electrolyte critical for heart rhythm and blood pressure; most people eat too little from food.',
    aliases: ['k', 'serum potassium']
  },
  // ── Thyroid ───────────────────────────────────────────────────────
  {
    id: 'tsh',
    name: 'TSH',
    short: 'TSH',
    unit: 'mIU/L',
    category: 'thyroid',
    std: { low: 0.4, high: 4.5 },
    opt: { low: 0.5, high: 2.5 },
    decimals: 2,
    desc: 'The pituitary signal driving the thyroid. High TSH suggests an underactive thyroid; low suggests overactivity.',
    advice:
      'If TSH drifts above ~2.5 with symptoms (fatigue, cold intolerance), ask about free T4 and thyroid antibodies.',
    aliases: ['thyroid stimulating hormone', 'thyrotropin']
  },
  {
    id: 'ft4',
    name: 'Free T4',
    short: 'fT4',
    unit: 'ng/dL',
    category: 'thyroid',
    std: { low: 0.8, high: 1.8 },
    opt: { low: 1.0, high: 1.6 },
    decimals: 2,
    desc: 'The circulating storage form of thyroid hormone, converted to active T3 in tissues.',
    aliases: ['free t4', 't4 free', 'thyroxine free']
  },
  {
    id: 'ft3',
    name: 'Free T3',
    short: 'fT3',
    unit: 'pg/mL',
    category: 'thyroid',
    std: { low: 2.3, high: 4.2 },
    opt: { low: 3.0, high: 4.2 },
    decimals: 1,
    desc: 'The active thyroid hormone. Chronically low-normal fT3 can accompany under-eating and overtraining.',
    aliases: ['free t3', 't3 free', 'triiodothyronine free']
  },
  // ── Blood (CBC & iron) ────────────────────────────────────────────
  {
    id: 'hemoglobin',
    name: 'Hemoglobin',
    short: 'Hgb',
    unit: 'g/dL',
    category: 'blood',
    std: { low: 13.5, high: 17.5 },
    opt: { low: 14.0, high: 17.0 },
    decimals: 1,
    desc: 'Oxygen-carrying protein in red cells — the headline number for anemia and endurance capacity.',
    aliases: ['hgb', 'hb']
  },
  {
    id: 'hematocrit',
    name: 'Hematocrit',
    short: 'Hct',
    unit: '%',
    category: 'blood',
    std: { low: 38.8, high: 50 },
    opt: { low: 40, high: 49 },
    decimals: 1,
    desc: 'The fraction of blood volume made of red cells.',
    aliases: ['hct']
  },
  {
    id: 'wbc',
    name: 'White blood cells',
    short: 'WBC',
    unit: 'K/µL',
    category: 'blood',
    std: { low: 4.0, high: 11.0 },
    opt: { low: 4.5, high: 8.0 },
    decimals: 1,
    desc: 'Immune cell count. Persistently high-normal values can reflect chronic inflammation.',
    aliases: ['white blood cell count', 'leukocytes']
  },
  {
    id: 'rbc',
    name: 'Red blood cells',
    short: 'RBC',
    unit: 'M/µL',
    category: 'blood',
    std: { low: 4.5, high: 5.9 },
    opt: { low: 4.6, high: 5.8 },
    decimals: 2,
    desc: 'Red cell count, read together with hemoglobin and MCV.',
    aliases: ['red blood cell count', 'erythrocytes']
  },
  {
    id: 'platelets',
    name: 'Platelets',
    short: 'Plt',
    unit: 'K/µL',
    category: 'blood',
    std: { low: 150, high: 450 },
    opt: { low: 175, high: 350 },
    decimals: 0,
    desc: 'Clotting cells; also rise with inflammation and iron deficiency.',
    aliases: ['platelet count', 'plt']
  },
  {
    id: 'mcv',
    name: 'MCV',
    short: 'MCV',
    unit: 'fL',
    category: 'blood',
    std: { low: 80, high: 100 },
    opt: { low: 85, high: 95 },
    decimals: 1,
    desc: 'Average red-cell size. Low hints at iron deficiency; high at B12/folate deficiency or alcohol.',
    aliases: ['mean corpuscular volume']
  },
  {
    id: 'ferritin',
    name: 'Ferritin',
    short: 'Ferritin',
    unit: 'ng/mL',
    category: 'blood',
    std: { low: 30, high: 400 },
    opt: { low: 50, high: 150 },
    decimals: 0,
    desc: 'The body’s iron store — but also an inflammation-reactive protein, so very high values need context.',
    advice:
      'Low: pair iron-rich food with vitamin C and re-test in 3 months. High with normal CRP: consider donation and re-check; discuss with your clinician.',
    aliases: ['serum ferritin']
  },
  // ── Micronutrients & hormones ─────────────────────────────────────
  {
    id: 'vitd',
    name: 'Vitamin D (25-OH)',
    short: 'Vit D',
    unit: 'ng/mL',
    category: 'micro',
    std: { low: 30, high: 100 },
    opt: { low: 40, high: 60 },
    decimals: 0,
    desc: 'Storage vitamin D — supports bone, muscle and immune function. Deficiency is extremely common at desk-job latitudes.',
    advice:
      'Sensible sun plus 1000–2000 IU/day D3 with a meal typically lands mid-range; re-test after 3 months.',
    aliases: [
      'vitamin d',
      '25-oh vitamin d',
      'vitamin d 25-hydroxy',
      '25-hydroxyvitamin d',
      'vitamin d, 25-hydroxy',
      'vit d'
    ]
  },
  {
    id: 'b12',
    name: 'Vitamin B12',
    short: 'B12',
    unit: 'pg/mL',
    category: 'micro',
    std: { low: 200, high: 900 },
    opt: { low: 500, high: 900 },
    decimals: 0,
    desc: 'Needed for nerves and red cells. "Normal-low" values (200–400) can still cause symptoms.',
    advice:
      'Low-normal with fatigue or tingling: a methylcobalamin supplement is cheap and safe — confirm with your clinician.',
    aliases: ['vitamin b12', 'cobalamin', 'b-12']
  },
  {
    id: 'folate',
    name: 'Folate',
    short: 'Folate',
    unit: 'ng/mL',
    category: 'micro',
    std: { low: 3, high: 20 },
    opt: { low: 10, high: 20 },
    decimals: 1,
    desc: 'B9 — works with B12 in methylation; low levels raise homocysteine.',
    aliases: ['serum folate', 'folic acid', 'vitamin b9']
  },
  {
    id: 'magnesium',
    name: 'Magnesium',
    short: 'Mg',
    unit: 'mg/dL',
    category: 'micro',
    std: { low: 1.7, high: 2.2 },
    opt: { low: 2.0, high: 2.2 },
    decimals: 1,
    desc: 'Serum magnesium is a blunt instrument (most Mg lives in cells), but low-normal still hints at inadequate intake.',
    advice: 'Nuts, seeds, legumes and dark chocolate; glycinate or citrate if supplementing.',
    aliases: ['mg', 'serum magnesium']
  },
  {
    id: 'zinc',
    name: 'Zinc',
    short: 'Zn',
    unit: 'µg/dL',
    category: 'micro',
    std: { low: 60, high: 120 },
    opt: { low: 80, high: 120 },
    decimals: 0,
    desc: 'Supports immunity, testosterone and wound healing; depleted by heavy sweating.',
    aliases: ['zn', 'serum zinc']
  },
  {
    id: 'testosterone',
    name: 'Testosterone (total)',
    short: 'Test',
    unit: 'ng/dL',
    category: 'micro',
    std: { low: 300, high: 1000 },
    opt: { low: 500, high: 900 },
    decimals: 0,
    desc: 'Male reference shown. Drives muscle, bone, mood and libido; sensitive to sleep, body fat and training load.',
    advice:
      'Sleep 7.5h+, lift heavy, keep body fat moderate, and don’t chronically under-eat — the four biggest natural levers.',
    aliases: ['total testosterone', 'testosterone total', 'testosterone']
  },
  {
    id: 'omega3',
    name: 'Omega-3 index',
    short: 'Ω-3',
    unit: '%',
    category: 'micro',
    std: { low: 4 },
    opt: { low: 8 },
    decimals: 1,
    desc: 'EPA+DHA as a share of red-cell membrane fats. Above 8% associates with lower cardiovascular risk.',
    advice: '2–3 servings of oily fish weekly, or ~1–2g EPA/DHA daily; re-test in 4 months.',
    aliases: ['omega 3 index', 'omega-3', 'o3 index']
  }
]

export const markerById = new Map(MARKERS.map((m) => [m.id, m]))

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9%]+/g, ' ').trim()

const aliasIndex = new Map<string, string>()
for (const m of MARKERS) {
  aliasIndex.set(normalize(m.name), m.id)
  aliasIndex.set(normalize(m.short), m.id)
  aliasIndex.set(normalize(m.id), m.id)
  for (const a of m.aliases ?? []) aliasIndex.set(normalize(a), m.id)
}

/** Match a free-text lab name (e.g. from a CSV) to a marker id, or undefined. */
export function matchMarker(name: string): string | undefined {
  return aliasIndex.get(normalize(name))
}
