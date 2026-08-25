import type { MarkerDef, SystemId } from '../types'

export const SYSTEMS: { id: SystemId; name: string; blurb: string }[] = [
  { id: 'cardio', name: 'Cardiovascular', blurb: 'Lipids & vascular risk' },
  { id: 'metabolic', name: 'Metabolic', blurb: 'Glucose & insulin control' },
  { id: 'inflammation', name: 'Inflammation', blurb: 'Systemic inflammation' },
  { id: 'liver', name: 'Liver', blurb: 'Hepatic function' },
  { id: 'kidney', name: 'Kidney', blurb: 'Renal function & electrolytes' },
  { id: 'thyroid', name: 'Thyroid', blurb: 'Thyroid axis' },
  { id: 'blood', name: 'Blood', blurb: 'CBC & iron status' },
  { id: 'lungs', name: 'Lungs', blurb: 'Pulmonary function' },
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
    femStd: { low: 50 },
    femOpt: { low: 60, high: 110 },
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
    aliases: ['triglyceride', 'trigs']
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
    femStd: { low: 2.4, high: 6.0 },
    femOpt: { low: 2.4, high: 5.5 },
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
    femStd: { low: 0.6, high: 1.1 },
    femOpt: { low: 0.6, high: 1.0 },
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
    femStd: { low: 12.0, high: 15.5 },
    femOpt: { low: 12.5, high: 15.0 },
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
    femStd: { low: 34.9, high: 44.5 },
    femOpt: { low: 36, high: 44 },
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
    femStd: { low: 4.1, high: 5.1 },
    femOpt: { low: 4.2, high: 5.0 },
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
    femStd: { low: 15, high: 150 },
    femOpt: { low: 40, high: 120 },
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
    femStd: { low: 15, high: 70 },
    femOpt: { low: 20, high: 60 },
    decimals: 0,
    desc: 'Reference ranges differ by sex — set yours in Settings. Drives muscle, bone, mood and libido; sensitive to sleep, body fat and training load.',
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
  },
  // ── Cardiovascular — advanced lipids & vascular function ──────────
  {
    id: 'apoa1',
    name: 'Apolipoprotein A1',
    short: 'ApoA1',
    unit: 'mg/dL',
    category: 'cardio',
    std: { low: 110 },
    opt: { low: 140 },
    decimals: 0,
    desc: 'The main protein of HDL particles. Higher levels track with better reverse cholesterol transport.',
    aliases: ['apo a1', 'apo a-1', 'apolipoprotein a1', 'apolipoprotein a-1']
  },
  {
    id: 'apob_apoa1',
    name: 'ApoB/ApoA1 ratio',
    short: 'ApoB/A1',
    unit: 'ratio',
    category: 'cardio',
    std: { high: 0.9 },
    opt: { high: 0.7 },
    decimals: 2,
    desc: 'Atherogenic-to-protective particle balance. One of the strongest single lipid predictors of cardiovascular events.',
    aliases: ['apob/apoa1 ratio', 'apo b/apo a1', 'apob apoa1 ratio']
  },
  {
    id: 'chol_hdl_ratio',
    name: 'Cholesterol/HDL ratio',
    short: 'TC/HDL',
    unit: 'ratio',
    category: 'cardio',
    std: { high: 5.0 },
    opt: { high: 3.5 },
    decimals: 1,
    desc: 'Total cholesterol divided by HDL. A quick composite of atherogenic burden versus protection.',
    aliases: ['cholesterol/hdl ratio', 'chol/hdl ratio', 'tc/hdl', 'total cholesterol/hdl']
  },
  {
    id: 'imt_left',
    name: 'Carotid IMT (left)',
    short: 'IMT L',
    unit: 'mm',
    category: 'cardio',
    std: { high: 0.9 },
    opt: { high: 0.7 },
    decimals: 2,
    desc: 'Intima-media thickness of the left common carotid — a direct ultrasound measure of early arterial wall change.',
    advice: 'IMT responds slowly to the same levers as ApoB: lipid control, blood pressure, and not smoking. Re-scan every 1–2 years to see the trend.',
    aliases: ['cca imt left', 'carotid imt left', 'imt left']
  },
  {
    id: 'imt_right',
    name: 'Carotid IMT (right)',
    short: 'IMT R',
    unit: 'mm',
    category: 'cardio',
    std: { high: 0.9 },
    opt: { high: 0.7 },
    decimals: 2,
    desc: 'Intima-media thickness of the right common carotid.',
    aliases: ['cca imt right', 'carotid imt right', 'imt right']
  },
  {
    id: 'bapwv',
    name: 'Pulse wave velocity (baPWV)',
    short: 'baPWV',
    unit: 'm/s',
    category: 'cardio',
    std: { high: 14 },
    opt: { high: 12 },
    decimals: 1,
    desc: 'Brachial-ankle pulse wave velocity — how fast the pressure wave travels through your arteries. Lower means more elastic vessels.',
    aliases: ['pulse wave velocity', 'pwv']
  },
  {
    id: 'abi_right',
    name: 'Ankle-brachial index (right)',
    short: 'ABI R',
    unit: 'ratio',
    category: 'cardio',
    std: { low: 0.9, high: 1.4 },
    opt: { low: 1.0, high: 1.3 },
    decimals: 2,
    desc: 'Ankle-to-arm blood pressure ratio. Below 0.9 suggests narrowing; above 1.4 suggests stiff, poorly compressible arteries — both worth a clinician conversation.',
    aliases: ['ankle-brachial index right', 'ankle brachial index right', 'abi right']
  },
  {
    id: 'abi_left',
    name: 'Ankle-brachial index (left)',
    short: 'ABI L',
    unit: 'ratio',
    category: 'cardio',
    std: { low: 0.9, high: 1.4 },
    opt: { low: 1.0, high: 1.3 },
    decimals: 2,
    desc: 'Ankle-to-arm blood pressure ratio on the left side.',
    aliases: ['ankle-brachial index left', 'ankle brachial index left', 'abi left']
  },
  {
    id: 'ef',
    name: 'Ejection fraction',
    short: 'EF',
    unit: '%',
    category: 'cardio',
    std: { low: 52, high: 75 },
    opt: { low: 55, high: 70 },
    decimals: 0,
    desc: 'The share of blood the left ventricle pumps out per beat, from echocardiogram.',
    aliases: ['lvef', 'ejection fraction']
  },
  {
    id: 'qtc',
    name: 'QTc interval',
    short: 'QTc',
    unit: 'ms',
    category: 'cardio',
    std: { high: 450 },
    opt: { high: 430 },
    decimals: 0,
    desc: 'Heart-rate-corrected QT interval from ECG. Prolongation matters for rhythm risk and some medication choices.',
    aliases: ['qtc interval', 'corrected qt'],
    femStd: { high: 470 },
    femOpt: { high: 450 }
  },
  {
    id: 'resting_hr_lab',
    name: 'Resting heart rate (exam)',
    short: 'HR',
    unit: 'bpm',
    category: 'cardio',
    std: { low: 45, high: 90 },
    opt: { low: 48, high: 68 },
    decimals: 0,
    desc: 'Heart rate at the exam. Falls with aerobic fitness; day-to-day resting HR lives in the Daily log.',
    aliases: ['heart rate', 'pulse rate']
  },
  {
    id: 'sdnn',
    name: 'HRV (SDNN)',
    short: 'SDNN',
    unit: 'ms',
    category: 'cardio',
    std: { low: 30 },
    opt: { low: 50 },
    decimals: 0,
    desc: 'Heart-rate variability. Higher generally reflects better autonomic balance and recovery; very protocol-dependent, so compare against your own baseline.',
    aliases: ['hrv sdnn', 'hrv']
  },
  // ── Lungs ─────────────────────────────────────────────────────────
  {
    id: 'fvc_pct',
    name: 'FVC % predicted',
    short: 'FVC %',
    unit: '%',
    category: 'lungs',
    std: { low: 80 },
    opt: { low: 95 },
    decimals: 0,
    desc: 'Forced vital capacity versus predicted for your age, height and sex — total exhalable lung volume.',
    aliases: ['fvc % predicted', 'fvc percent predicted']
  },
  {
    id: 'fev1_pct',
    name: 'FEV1 % predicted',
    short: 'FEV1 %',
    unit: '%',
    category: 'lungs',
    std: { low: 80 },
    opt: { low: 100 },
    decimals: 0,
    desc: 'Air moved in the first second of a hard exhale, versus predicted. The workhorse spirometry number.',
    aliases: ['fev1 % predicted', 'fev1 percent predicted']
  },
  {
    id: 'fev1_fvc',
    name: 'FEV1/FVC ratio',
    short: 'FEV1/FVC',
    unit: 'ratio',
    category: 'lungs',
    std: { low: 0.7 },
    opt: { low: 0.75 },
    decimals: 2,
    desc: 'The obstruction screen: below 0.70 suggests airflow limitation. Aerobic training and not smoking protect it.',
    aliases: ['fev1/fvc', 'fev1 fvc ratio']
  },
  // ── Metabolic — additional ────────────────────────────────────────
  {
    id: 'c_peptide',
    name: 'C-Peptide',
    short: 'C-Pep',
    unit: 'ng/mL',
    category: 'metabolic',
    std: { low: 0.8, high: 3.85 },
    opt: { low: 1.1, high: 3.0 },
    decimals: 2,
    desc: 'Released 1:1 with insulin, but cleared more slowly — a steadier read on how hard the pancreas works.',
    aliases: ['c peptide']
  },
  {
    id: 'lp_ir',
    name: 'Insulin resistance score (LP-IR)',
    short: 'LP-IR',
    unit: 'score',
    category: 'metabolic',
    std: { high: 63 },
    opt: { high: 45 },
    decimals: 0,
    desc: 'NMR-derived 0–100 insulin resistance score from lipoprotein particle sizes. Under 45 is insulin-sensitive territory.',
    aliases: ['insulin resistance score', 'lp-ir', 'lp ir score']
  },
  // ── Kidney — electrolytes & chemistry ─────────────────────────────
  {
    id: 'chloride',
    name: 'Chloride',
    short: 'Cl',
    unit: 'mmol/L',
    category: 'kidney',
    std: { low: 98, high: 107 },
    opt: { low: 100, high: 106 },
    decimals: 0,
    desc: 'A major electrolyte, read alongside sodium and CO₂ for acid-base balance.',
    aliases: ['cl', 'serum chloride']
  },
  {
    id: 'co2',
    name: 'CO₂ (bicarbonate)',
    short: 'CO₂',
    unit: 'mmol/L',
    category: 'kidney',
    std: { low: 20, high: 29 },
    opt: { low: 23, high: 28 },
    decimals: 0,
    desc: 'Serum bicarbonate — the blood’s main acid buffer. Low values can reflect high-protein/low-carb eating, intense training, or acid-base issues worth re-checking.',
    aliases: ['carbon dioxide', 'bicarbonate', 'hco3', 'co2 total']
  },
  {
    id: 'calcium',
    name: 'Calcium',
    short: 'Ca',
    unit: 'mg/dL',
    category: 'kidney',
    std: { low: 8.6, high: 10.2 },
    opt: { low: 9.0, high: 10.0 },
    decimals: 1,
    desc: 'Tightly regulated by parathyroid hormone and vitamin D; persistent highs or lows need follow-up, not supplements.',
    aliases: ['ca', 'serum calcium']
  },
  // ── Liver — additional ────────────────────────────────────────────
  {
    id: 'total_protein',
    name: 'Total protein',
    short: 'T.Prot',
    unit: 'g/dL',
    category: 'liver',
    std: { low: 6.0, high: 8.5 },
    opt: { low: 6.5, high: 8.0 },
    decimals: 1,
    desc: 'Albumin plus globulins — overall protein synthesis and immune protein load.',
    aliases: ['protein total', 'protein, total']
  },
  {
    id: 'globulin',
    name: 'Globulin',
    short: 'Glob',
    unit: 'g/dL',
    category: 'liver',
    std: { low: 1.5, high: 4.5 },
    opt: { low: 2.0, high: 3.5 },
    decimals: 1,
    desc: 'The non-albumin blood proteins, mostly immune-related.',
    aliases: ['serum globulin']
  },
  {
    id: 'ag_ratio',
    name: 'Albumin/globulin ratio',
    short: 'A/G',
    unit: 'ratio',
    category: 'liver',
    std: { low: 1.2, high: 2.2 },
    opt: { low: 1.5, high: 2.2 },
    decimals: 1,
    desc: 'Albumin relative to globulin; a low ratio prompts a look at both sides.',
    aliases: ['albumin/globulin ratio', 'a/g ratio', 'ag ratio']
  },
  {
    id: 'fib4',
    name: 'FIB-4 index',
    short: 'FIB-4',
    unit: 'score',
    category: 'liver',
    std: { high: 1.3 },
    opt: { high: 1.0 },
    decimals: 2,
    desc: 'A fibrosis screen computed from age, AST, ALT and platelets. Below 1.3 makes advanced scarring unlikely.',
    aliases: ['fib-4', 'fib 4', 'fib4 score']
  },
  {
    id: 'liver_stiffness',
    name: 'Liver stiffness (FibroScan)',
    short: 'Stiffness',
    unit: 'kPa',
    category: 'liver',
    std: { high: 7.0 },
    opt: { high: 5.5 },
    decimals: 1,
    desc: 'Elastography measure of liver scarring. Under 7 kPa argues against significant fibrosis.',
    aliases: ['liver stiffness', 'liver stiffness e', 'fibroscan e', 'liver stiffness (e)']
  },
  {
    id: 'cap_score',
    name: 'Liver fat (CAP)',
    short: 'CAP',
    unit: 'dB/m',
    category: 'liver',
    std: { high: 268 },
    opt: { high: 238 },
    decimals: 0,
    desc: 'Controlled attenuation parameter — an ultrasound estimate of liver fat. Rising values track early fatty liver, which reverses with weight loss and less alcohol/sugar.',
    advice: 'Liver fat is among the most reversible findings there is: a 5–10% body-weight drop, minimal alcohol, and fewer liquid sugars typically normalize it within months.',
    aliases: ['cap', 'controlled attenuation parameter', 'cap score']
  },
  // ── Thyroid — additional ──────────────────────────────────────────
  {
    id: 'rt3',
    name: 'Reverse T3',
    short: 'rT3',
    unit: 'ng/dL',
    category: 'thyroid',
    std: { low: 9, high: 24 },
    opt: { low: 9, high: 18 },
    decimals: 1,
    desc: 'An inactive thyroid metabolite that rises with illness, severe dieting and stress.',
    aliases: ['reverse t3', 'rt3']
  },
  {
    id: 'tpo_ab',
    name: 'TPO antibodies',
    short: 'TPO Ab',
    unit: 'IU/mL',
    category: 'thyroid',
    std: { high: 34 },
    opt: { high: 9 },
    decimals: 0,
    desc: 'Antibodies against thyroid peroxidase — the main marker of autoimmune (Hashimoto) thyroid disease.',
    aliases: ['thyroid peroxidase antibodies', 'anti-tpo', 'tpo']
  },
  {
    id: 'tg_ab',
    name: 'Thyroglobulin antibodies',
    short: 'Tg Ab',
    unit: 'IU/mL',
    category: 'thyroid',
    std: { high: 4 },
    opt: { high: 4 },
    decimals: 1,
    desc: 'A second thyroid autoantibody, read together with TPO antibodies. Negative cutoffs vary by assay (1–4 IU/mL); "<X" results are negative.',
    aliases: ['anti-thyroglobulin', 'tg antibodies']
  },
  // ── Blood — iron panel & extended CBC ─────────────────────────────
  {
    id: 'iron',
    name: 'Iron (serum)',
    short: 'Iron',
    unit: 'µg/dL',
    category: 'blood',
    std: { low: 50, high: 180 },
    opt: { low: 70, high: 150 },
    decimals: 0,
    desc: 'Circulating iron — swings with recent meals, so read alongside ferritin and saturation.',
    aliases: ['serum iron'],
    femStd: { low: 35, high: 145 },
    femOpt: { low: 60, high: 130 }
  },
  {
    id: 'tibc',
    name: 'TIBC',
    short: 'TIBC',
    unit: 'µg/dL',
    category: 'blood',
    std: { low: 250, high: 450 },
    opt: { low: 250, high: 400 },
    decimals: 0,
    desc: 'Total iron-binding capacity — rises when the body wants more iron.',
    aliases: ['total iron binding capacity', 'iron binding capacity']
  },
  {
    id: 'iron_sat',
    name: 'Iron saturation',
    short: 'TSAT',
    unit: '%',
    category: 'blood',
    std: { low: 15, high: 55 },
    opt: { low: 25, high: 45 },
    decimals: 0,
    desc: 'How full the iron-transport protein is. Persistently above ~45–50% is a hemochromatosis screen prompt.',
    aliases: ['transferrin saturation', 'tsat', '% saturation']
  },
  {
    id: 'mch',
    name: 'MCH',
    short: 'MCH',
    unit: 'pg',
    category: 'blood',
    std: { low: 27, high: 33 },
    opt: { low: 28, high: 32 },
    decimals: 1,
    desc: 'Average hemoglobin per red cell.',
    aliases: ['mean corpuscular hemoglobin']
  },
  {
    id: 'mchc',
    name: 'MCHC',
    short: 'MCHC',
    unit: 'g/dL',
    category: 'blood',
    std: { low: 32, high: 36 },
    opt: { low: 33, high: 35.5 },
    decimals: 1,
    desc: 'Hemoglobin concentration within red cells.',
    aliases: ['mean corpuscular hemoglobin concentration']
  },
  {
    id: 'rdw',
    name: 'RDW',
    short: 'RDW',
    unit: '%',
    category: 'blood',
    std: { low: 11.5, high: 14.5 },
    opt: { low: 11.5, high: 13.5 },
    decimals: 1,
    desc: 'Variation in red-cell size. Creeping upward is an early, unspecific flag for nutrient deficiency or inflammation.',
    aliases: ['red cell distribution width']
  },
  {
    id: 'mpv',
    name: 'MPV',
    short: 'MPV',
    unit: 'fL',
    category: 'blood',
    std: { low: 7.5, high: 12 },
    opt: { low: 8, high: 11.5 },
    decimals: 1,
    desc: 'Mean platelet volume — average platelet size.',
    aliases: ['mean platelet volume']
  },
  {
    id: 'neut_abs',
    name: 'Neutrophils (absolute)',
    short: 'Neut',
    unit: 'cells/µL',
    category: 'blood',
    std: { low: 1500, high: 7800 },
    opt: { low: 1800, high: 6500 },
    decimals: 0,
    desc: 'The front-line bacterial defenders. Value in cells/µL.',
    aliases: ['neutrophils absolute', 'absolute neutrophils', 'anc']
  },
  {
    id: 'lymph_abs',
    name: 'Lymphocytes (absolute)',
    short: 'Lymph',
    unit: 'cells/µL',
    category: 'blood',
    std: { low: 850, high: 3900 },
    opt: { low: 1000, high: 3500 },
    decimals: 0,
    desc: 'T-cells, B-cells and NK cells. Value in cells/µL.',
    aliases: ['lymphocytes absolute', 'absolute lymphocytes']
  },
  {
    id: 'mono_abs',
    name: 'Monocytes (absolute)',
    short: 'Mono',
    unit: 'cells/µL',
    category: 'blood',
    std: { low: 200, high: 950 },
    opt: { low: 200, high: 800 },
    decimals: 0,
    desc: 'Tissue-macrophage precursors; high-normal counts loosely track chronic inflammation. Value in cells/µL.',
    aliases: ['monocytes absolute', 'absolute monocytes']
  },
  {
    id: 'eos_abs',
    name: 'Eosinophils (absolute)',
    short: 'Eos',
    unit: 'cells/µL',
    category: 'blood',
    std: { low: 15, high: 500 },
    opt: { low: 15, high: 400 },
    decimals: 0,
    desc: 'Allergy- and parasite-responsive white cells. Value in cells/µL.',
    aliases: ['eosinophils absolute', 'absolute eosinophils']
  },
  {
    id: 'baso_abs',
    name: 'Basophils (absolute)',
    short: 'Baso',
    unit: 'cells/µL',
    category: 'blood',
    std: { high: 200 },
    opt: { high: 150 },
    decimals: 0,
    desc: 'The rarest white cells. Value in cells/µL.',
    aliases: ['basophils absolute', 'absolute basophils']
  },
  // ── Hormones (micro) — additional ─────────────────────────────────
  {
    id: 'test_free',
    name: 'Testosterone (free)',
    short: 'Free T',
    unit: 'pg/mL',
    category: 'micro',
    std: { low: 35, high: 155 },
    opt: { low: 65, high: 130 },
    decimals: 1,
    desc: 'The unbound, biologically active fraction. More informative than total when SHBG is unusual.',
    aliases: ['free testosterone', 'testosterone free'],
    femStd: { low: 0.1, high: 6.4 },
    femOpt: { low: 1.0, high: 5.0 }
  },
  {
    id: 'test_bio',
    name: 'Testosterone (bioavailable)',
    short: 'Bio T',
    unit: 'ng/dL',
    category: 'micro',
    std: { low: 110, high: 575 },
    opt: { low: 150, high: 450 },
    decimals: 1,
    desc: 'Free plus loosely albumin-bound testosterone — the fraction tissues can actually use.',
    aliases: ['bioavailable testosterone', 'testosterone bioavailable'],
    femStd: { low: 0.5, high: 8.5 },
    femOpt: { low: 1, high: 7 }
  },
  {
    id: 'shbg',
    name: 'SHBG',
    short: 'SHBG',
    unit: 'nmol/L',
    category: 'micro',
    std: { low: 10, high: 50 },
    opt: { low: 20, high: 45 },
    decimals: 0,
    desc: 'The protein that binds sex hormones. Low SHBG commonly travels with insulin resistance and liver fat; high with thyroid excess or low energy intake.',
    aliases: ['sex hormone binding globulin'],
    femStd: { low: 17, high: 124 }
  },
  {
    id: 'estradiol',
    name: 'Estradiol',
    short: 'E2',
    unit: 'pg/mL',
    category: 'micro',
    std: { low: 8, high: 40 },
    opt: { low: 15, high: 35 },
    decimals: 0,
    desc: 'Male reference shown; in women it varies across the cycle, so track against your own timing. Both very low and high values matter for bone and mood.',
    aliases: ['e2', 'oestradiol'],
    femStd: { low: 15, high: 350 },
    femOpt: { low: 15, high: 350 }
  },
  {
    id: 'dhea_s',
    name: 'DHEA sulfate',
    short: 'DHEA-S',
    unit: 'µg/dL',
    category: 'micro',
    std: { low: 89, high: 457 },
    opt: { low: 150, high: 400 },
    decimals: 0,
    desc: 'The adrenal androgen reservoir; declines steadily with age, so interpret against age-matched ranges.',
    aliases: ['dhea-s', 'dheas', 'dhea sulfate'],
    femStd: { low: 57, high: 279 },
    femOpt: { low: 100, high: 279 }
  },
  {
    id: 'cortisol_am',
    name: 'Cortisol (AM)',
    short: 'Cortisol',
    unit: 'µg/dL',
    category: 'micro',
    std: { low: 6, high: 18.4 },
    opt: { low: 8, high: 16 },
    decimals: 1,
    desc: 'Morning cortisol, the daily peak. Timing matters — a mid-day draw reads low without meaning anything.',
    aliases: ['am cortisol', 'morning cortisol', 'cortisol am']
  },
  {
    id: 'psa',
    name: 'PSA (total)',
    short: 'PSA',
    unit: 'ng/mL',
    category: 'micro',
    std: { high: 4.0 },
    opt: { high: 1.0 },
    decimals: 2,
    desc: 'Prostate-specific antigen. Interpretation depends on age and trend — a rising value matters more than a single number.',
    aliases: ['psa total', 'prostate specific antigen']
  }
]

export const markerById = new Map(MARKERS.map((m) => [m.id, m]))

export const normalizeMarkerName = (s: string) =>
  s.normalize('NFKD').toLowerCase().replace(/[^a-z0-9%]+/g, ' ').trim()

/**
 * Keys too generic to match safely — a CSV row named "Test", "Tg", "CAP",
 * "HR", "NA" or "CO" plausibly means something else, so these never index
 * (the markers stay reachable through their unambiguous names/aliases).
 */
const BLOCKED_KEYS = new Set(['test', 'tg', 'stiffness', 'hr', 'na', 'co'])
/** Deliberate chemical symbols exempt from the minimum-length guard. */
const SYMBOL_KEYS = new Set(['k', 'ca', 'cl', 'mg'])

const aliasIndex = new Map<string, string>()
const addKey = (raw: string, id: string) => {
  const key = normalizeMarkerName(raw)
  if (!key || BLOCKED_KEYS.has(key)) return
  if ((key.length < 2 || /^\d+%?$/.test(key)) && !SYMBOL_KEYS.has(key)) return
  aliasIndex.set(key, id)
}
for (const m of MARKERS) {
  addKey(m.name, m.id)
  addKey(m.short, m.id)
  addKey(m.id, m.id)
  for (const a of m.aliases ?? []) addKey(a, m.id)
}

/** Match a free-text lab name (e.g. from a CSV) to a marker id, or undefined. */
export function matchMarker(name: string): string | undefined {
  return aliasIndex.get(normalizeMarkerName(name))
}
