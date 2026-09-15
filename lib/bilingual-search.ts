/**
 * Bilingual (Arabic <-> English) Search Engine for EngiMart
 * Handles cross-lingual queries, engineering term synonyms,
 * Arabic normalization, and phonetic transliteration.
 */

export function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    // remove diacritics / tashkeel
    .replace(/[\u064B-\u065F\u0670]/g, "")
    // normalize alef with hamza / madda
    .replace(/[إأآٱ]/g, "ا")
    // normalize teh marbuta
    .replace(/ة/g, "ه")
    // normalize alef maksura to yaa
    .replace(/ى/g, "ي")
    // normalize hamza variants
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    // remove kashida / tatweel
    .replace(/ـ/g, "")
    // normalize arabic digits to english digits
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .trim()
    .toLowerCase();
}

export function normalizeEnglish(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

// Strip common Arabic prefixes like "ال" (the) or "و" (and)
export function stripArabicPrefixes(word: string): string[] {
  const norm = normalizeArabic(word);
  const variants = [norm];
  if (norm.startsWith("ال") && norm.length > 3) {
    variants.push(norm.slice(2));
  }
  if (norm.startsWith("وال") && norm.length > 4) {
    variants.push(norm.slice(3));
  }
  if ((norm.startsWith("و") || norm.startsWith("ف") || norm.startsWith("ب") || norm.startsWith("ك") || norm.startsWith("ل")) && norm.length > 3) {
    variants.push(norm.slice(1));
  }
  return Array.from(new Set(variants));
}

// ---------------------------------------------------------------------------
// Comprehensive Electronics & Engineering Domain Bilingual Dictionary
// ---------------------------------------------------------------------------
export type SynonymGroup = {
  en: string[];
  ar: string[];
};

export const BILINGUAL_SYNONYMS: SynonymGroup[] = [
  // Microcontrollers & Boards
  {
    en: ["arduino", "ard", "uno", "mega", "nano", "microcontroller", "mcu"],
    ar: ["اردوينو", "أردوينو", "اردينو", "اونو", "أونو", "ميجا", "ميغا", "نانو", "متحكم", "مايكروكنترولر", "ميكروكنترولر"],
  },
  {
    en: ["esp32", "esp8266", "esp", "nodemcu", "wifi", "bluetooth", "wemos"],
    ar: ["اي اس بي", "اسب", "إي إس بي", "واي فاي", "وايفاي", "بلوتوث", "نود ام سي يو", "نود امسيو"],
  },
  {
    en: ["raspberry", "raspberry pi", "raspi", "rpi", "pi", "pi 5", "pi 4", "pico"],
    ar: ["راسبيري", "راسبيري باي", "رازبيري", "باي", "رسبيري", "بيكو"],
  },
  {
    en: ["stm32", "arm", "cortex", "blue pill"],
    ar: ["اس تي ام", "ارم", "كورتكس", "بلو بيل"],
  },

  // Prototyping & Wiring
  {
    en: ["breadboard", "bread board", "protoboard", "solderless", "tie", "strip"],
    ar: ["بريدبورد", "بريد بورد", "بردبورد", "لوحة تجارب", "بوردة تجارب", "لوحة تجريبية", "تست بورد"],
  },
  {
    en: ["jumper", "jumpers", "wire", "wires", "jumper wire", "cable", "cables", "dupont", "lead", "leads"],
    ar: ["جامبر", "جمبر", "جامبرز", "سلك", "اسلاك", "أسلاك", "سلوك", "كابل", "كابلات", "وصلة", "وصلات", "دوبونت"],
  },
  {
    en: ["pcb", "board", "circuit board", "copper", "perfboard"],
    ar: ["بي سي بي", "لوحة", "بوردة", "دائرة مطبوعة", "كارته", "بورد"],
  },
  {
    en: ["header", "pin", "pins", "header pin", "male", "female", "connector"],
    ar: ["هيدر", "بنز", "سنون", "اطراف", "ميل", "فيميل", "ذكر", "انثى", "كونكتور"],
  },

  // Test & Measurement Tools
  {
    en: ["multimeter", "meter", "avometer", "avo", "tester", "voltmeter", "ammeter", "ohmmeter"],
    ar: ["ملتيميتر", "ملتي ميتر", "ملتيمتر", "افوميتر", "أفوميتر", "افو", "أفو", "فولتميتر", "اميتر", "جهاز قياس", "مقياس", "تستر"],
  },
  {
    en: ["soldering iron", "soldering", "iron", "solder", "soldering station", "welding"],
    ar: ["مكواة لحام", "مكواه لحام", "مكواة", "مكواه", "كاوية", "كاويه", "كاوي", "لحام", "قصدير", "محطة لحام"],
  },
  {
    en: ["solder wire", "flux", "sponge", "desoldering", "sucker", "pump", "wick", "rosin"],
    ar: ["قصدير لحام", "فلاكس", "مساعد لحام", "شفاط قصدير", "سفنجة", "شيلد لحام", "شحم لحام"],
  },
  {
    en: ["logic analyzer", "oscilloscope", "scope"],
    ar: ["لوجيك انالايزر", "اوسيلوسكوب", "راسم اشارة", "محلل منطقي"],
  },
  {
    en: ["probe", "probes", "alligator", "crocodile", "clip", "clips"],
    ar: ["بروب", "مجس", "مجسات", "تماسيح", "تمساح", "مشبك", "مشابك"],
  },
  {
    en: ["cutter", "pliers", "wire stripper", "tweezers"],
    ar: ["قصافة", "بنسة", "قشارة اسلاك", "ملقاط", "جفت"],
  },

  // Passive Components
  {
    en: ["resistor", "resistors", "resistance", "ohm", "resistor pack", "resistor kit"],
    ar: ["مقاومة", "مقاومات", "ريزستور", "اوم", "علبة مقاومات", "طقم مقاومات"],
  },
  {
    en: ["potentiometer", "pot", "variable resistor", "trimmer", "preset"],
    ar: ["بوتنشيوميتر", "بوتنشوميتر", "مقاومة متغيرة", "فوليوم", "بوت"],
  },
  {
    en: ["capacitor", "capacitors", "cap", "ceramic", "electrolytic", "tantalum"],
    ar: ["مكثف", "مكثفات", "كاباستور", "كباستور", "سيراميك", "كيميائي"],
  },
  {
    en: ["inductor", "choke", "coil"],
    ar: ["ملف", "محث", "كويل", "ملفات"],
  },

  // Semiconductors & Active Components
  {
    en: ["diode", "diodes", "rectifier", "zener", "1n4007", "schottky"],
    ar: ["دايود", "دايودات", "ديود", "موحد", "زينر", "شوتكي"],
  },
  {
    en: ["led", "leds", "rgb", "light", "diode"],
    ar: ["ليد", "ليدات", "ال اي دي", "مصباح", "لمبة", "ار جي بي"],
  },
  {
    en: ["transistor", "transistors", "bjt", "mosfet", "fet", "npn", "pnp", "2n2222"],
    ar: ["ترانزستور", "ترانزيستور", "موسفيت", "موسفت", "ترانزستورات"],
  },
  {
    en: ["relay", "relays", "relay module", "contactor"],
    ar: ["ريليه", "ريلي", "راليه", "مرحل", "موديول ريليه", "ريلاي"],
  },
  {
    en: ["ic", "integrated circuit", "chip", "op amp", "ne555", "555", "timer"],
    ar: ["اي سي", "ايسي", "شريحة", "دائرة متكاملة", "تايمر 555", "مكبر عمليات", "اوپ امب"],
  },

  // Sensors & Actuators
  {
    en: ["sensor", "sensors", "detector", "module"],
    ar: ["حساس", "حساسات", "سنسور", "سينسور", "كاشف", "موديول", "مستشعر"],
  },
  {
    en: ["ultrasonic", "distance", "hc-sr04", "sonar", "ultrasound"],
    ar: ["التراسونيك", "الترا سونيك", "التراسونك", "فوق صوتي", "موجات فوق صوتية", "حساس مسافة", "سونار"],
  },
  {
    en: ["pir", "motion", "infrared", "ir", "obstacle"],
    ar: ["حركة", "بي اي ار", "انفرارد", "اشعة تحت الحمراء", "حساس حركة", "مانع تصادم"],
  },
  {
    en: ["temperature", "humidity", "dht11", "dht22", "thermistor", "lm35", "temp"],
    ar: ["حرارة", "رطوبة", "حساس حرارة", "ترمومتر", "ثيرميستور", "درجة الحرارة"],
  },
  {
    en: ["light", "ldr", "photoresistor", "photodiode", "optical"],
    ar: ["ضوء", "حساس ضوء", "مقاومة ضوئية", "ال دي ار", "ضوئي"],
  },
  {
    en: ["gas", "smoke", "mq", "mq2", "mq3", "mq7"],
    ar: ["غاز", "دخان", "حساس غاز", "حساس دخان"],
  },
  {
    en: ["sound", "microphone", "mic", "voice", "audio"],
    ar: ["صوت", "ميكروفون", "مايك", "حساس صوت"],
  },
  {
    en: ["gyro", "gyroscope", "accelerometer", "mpu6050", "imu", "tilt"],
    ar: ["جيروسكوب", "تسارع", "حساس ميل", "ام بي يو"],
  },
  {
    en: ["weight", "load cell", "hx711", "scale"],
    ar: ["وزن", "ميزان", "خلية وزن", "لود سيل"],
  },
  {
    en: ["water", "rain", "soil", "moisture", "level"],
    ar: ["ماء", "مطر", "تربة", "رطوبة تربة", "مستوى الماء"],
  },

  // Motors & Movement
  {
    en: ["servo", "servos", "sg90", "mg995", "mg996", "micro servo"],
    ar: ["سيرفو", "سرفو", "سيرفو موتور", "محرك سيرفو"],
  },
  {
    en: ["motor", "motors", "dc", "dc motor", "gear motor", "stepper", "nema"],
    ar: ["موتور", "ماتور", "محرك", "محركات", "ستيبر", "خطوي", "دي سي"],
  },
  {
    en: ["motor driver", "driver", "l298n", "l293d", "a4988", "drv8825", "shield"],
    ar: ["درايفر", "درايفر موتور", "مشغل محرك", "شيلد موتور"],
  },
  {
    en: ["wheel", "wheels", "chassis", "car", "robot", "robotics"],
    ar: ["عجلة", "عجل", "كفر", "شاسيه", "عربية", "سيارة", "روبوت", "روبوتكس"],
  },

  // Displays & Sound
  {
    en: ["display", "lcd", "oled", "screen", "16x2", "20x4", "i2c", "tft"],
    ar: ["شاشة", "شاشه", "ال سي دي", "اوليد", "دسبلاي", "اي تو سي", "ديسبلاي"],
  },
  {
    en: ["segment", "seven segment", "7-segment", "digit"],
    ar: ["سفن سيجمنت", "سيفن سيجمنت", "شاشة ارقام"],
  },
  {
    en: ["buzzer", "beeper", "alarm", "speaker", "sounder", "tone"],
    ar: ["بازر", "بزر", "بظر", "طنان", "جرس", "سبيكر", "سماعة", "منبه"],
  },

  // Power, Batteries, & Chargers
  {
    en: ["battery", "batteries", "lipo", "lithium", "18650", "9v", "cell"],
    ar: ["بطارية", "بطاريه", "بطاريات", "حجارة", "ليثيوم", "لايبو", "٩ فولت", "9 فولت"],
  },
  {
    en: ["power", "power supply", "supply", "adapter", "psu", "source"],
    ar: ["باور", "باور سبلاي", "مزود طاقة", "تغذية", "وحدة تغذية", "مصدر طاقة"],
  },
  {
    en: ["charger", "bms", "charging", "tp4056", "protection"],
    ar: ["شاحن", "دائرة شحن", "بي ام اس", "حماية بطارية"],
  },
  {
    en: ["converter", "regulator", "step down", "step up", "buck", "boost", "lm7805", "ams1117"],
    ar: ["محول", "منظم جهد", "ريجيولاتور", "ستيب داون", "ستيب اب", "باك", "بوست"],
  },

  // 3D Printing & Materials
  {
    en: ["filament", "pla", "abs", "petg", "3d", "print", "printing", "spool"],
    ar: ["فيلمنت", "فلمنت", "فيلامنت", "خيط طباعة", "خيط طابعة", "خيط ثلاثي", "بكرة خيط", "طباعة ثلاثية"],
  },
  {
    en: ["nozzle", "hotend", "extruder", "bed", "heater"],
    ar: ["نوزل", "فوهة", "اكسترودر", "هوت اند", "سرير حراري"],
  },

  // Switches & Inputs
  {
    en: ["switch", "switches", "button", "buttons", "push button", "toggle", "tactile", "key"],
    ar: ["سويتش", "زر", "زرار", "مفتاح", "ضاغط", "سويتشات", "ازرار", "كبسة"],
  },
  {
    en: ["keypad", "matrix", "keyboard"],
    ar: ["كيباد", "لوحة مفاتيح", "مصفوفة"],
  },
  {
    en: ["joystick", "stick"],
    ar: ["جويستيك", "عصا تحكم", "جوي ستيك"],
  },
  {
    en: ["encoder", "rotary encoder"],
    ar: ["انكودر", "محدد دوران"],
  },

  // Accessories & Consumables
  {
    en: ["heat shrink", "shrink", "tube", "tubing", "insulation", "tape"],
    ar: ["شيرنك", "هيت شيرنك", "هيت شرنك", "عازل", "شكرتون", "شريط لحام"],
  },
  {
    en: ["screw", "screws", "nut", "nuts", "standoff", "spacer"],
    ar: ["مسمار", "مسامير", "صامولة", "صواميل", "سبيسر", "عمود تثبيت"],
  },
  {
    en: ["kit", "starter kit", "learning", "pack", "set"],
    ar: ["كيت", "حقيبة", "طقم", "مجموعة", "شنطة", "باك"],
  },
];

// ---------------------------------------------------------------------------
// Phonetic Transliteration (Arabic <-> English approximation)
// ---------------------------------------------------------------------------
const AR_TO_EN_MAP: Record<string, string> = {
  ا: "a",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "j",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "z",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  و: "o",
  ي: "i",
  ة: "h",
  ى: "a",
};

export function arabicToLatinPhonetic(arabicText: string): string {
  const norm = normalizeArabic(arabicText);
  let res = "";
  for (let i = 0; i < norm.length; i++) {
    const char = norm[i];
    res += AR_TO_EN_MAP[char] || char;
  }
  return res.replace(/\s+/g, " ").trim();
}

const EN_TO_AR_MAP: Record<string, string> = {
  a: "ا",
  b: "ب",
  c: "ك",
  d: "د",
  e: "ي",
  f: "ف",
  g: "ج",
  h: "ه",
  i: "ي",
  j: "ج",
  k: "ك",
  l: "ل",
  m: "م",
  n: "ن",
  o: "و",
  p: "ب",
  q: "ك",
  r: "ر",
  s: "س",
  t: "ت",
  u: "و",
  v: "ف",
  w: "و",
  x: "اكس",
  y: "ي",
  z: "ز",
};

export function latinToArabicPhonetic(latinText: string): string {
  const clean = latinText.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  let res = "";
  let i = 0;
  while (i < clean.length) {
    const double = clean.slice(i, i + 2);
    if (double === "sh") {
      res += "ش";
      i += 2;
    } else if (double === "ch") {
      res += "تش";
      i += 2;
    } else if (double === "kh") {
      res += "خ";
      i += 2;
    } else if (double === "th") {
      res += "ث";
      i += 2;
    } else if (double === "gh") {
      res += "غ";
      i += 2;
    } else if (double === "ph") {
      res += "ف";
      i += 2;
    } else if (double === "oo" || double === "ou") {
      res += "و";
      i += 2;
    } else if (double === "ee" || double === "ea") {
      res += "ي";
      i += 2;
    } else {
      const single = clean[i];
      res += EN_TO_AR_MAP[single] || single;
      i++;
    }
  }
  return normalizeArabic(res);
}

// ---------------------------------------------------------------------------
// Query Expansion: Takes a search string and returns all related search terms
// ---------------------------------------------------------------------------
export function expandSearchTerms(query: string): string[] {
  const raw = query.trim();
  if (!raw) return [];

  const tokens = raw
    .toLowerCase()
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const expanded = new Set<string>();
  expanded.add(raw.toLowerCase());

  // Also process words with Arabic normalization
  const normalizedRaw = normalizeArabic(raw);
  expanded.add(normalizedRaw);

  // Strip prefixes from Arabic words
  const prefixStripped = stripArabicPrefixes(normalizedRaw);
  prefixStripped.forEach((s) => expanded.add(s));

  // Phonetic transliteration
  if (isArabic(raw)) {
    const enPhonetic = arabicToLatinPhonetic(normalizedRaw);
    if (enPhonetic) expanded.add(enPhonetic);
  } else {
    const arPhonetic = latinToArabicPhonetic(raw);
    if (arPhonetic) expanded.add(arPhonetic);
  }

  // Check against our comprehensive bilingual dictionary
  for (const group of BILINGUAL_SYNONYMS) {
    const normalizedArInGroup = group.ar.map(normalizeArabic);
    const normalizedEnInGroup = group.en.map((s) => s.toLowerCase());

    // Check if any query token or stripped variant matches English synonyms
    const matchesEn = tokens.some((token) =>
      normalizedEnInGroup.some((enTerm) => enTerm.includes(token) || token.includes(enTerm)),
    );

    // Check if any query token or stripped variant matches Arabic synonyms
    const allQueryArVariants = [
      normalizedRaw,
      ...tokens.map(normalizeArabic),
      ...tokens.flatMap(stripArabicPrefixes),
    ];

    const matchesAr = allQueryArVariants.some((variant) =>
      normalizedArInGroup.some((arTerm) => arTerm.includes(variant) || variant.includes(arTerm)),
    );

    if (matchesEn || matchesAr) {
      group.en.forEach((t) => expanded.add(t.toLowerCase()));
      group.ar.forEach((t) => {
        expanded.add(t);
        expanded.add(normalizeArabic(t));
      });
    }
  }

  return Array.from(expanded).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Product Search Token Generator (for indexing each product)
// ---------------------------------------------------------------------------
export function generateProductSearchTokens(name: string, description: string = ""): string {
  const combined = `${name} ${description}`.toLowerCase();
  const tokens = new Set<string>();

  // Add original words
  tokens.add(combined);
  tokens.add(normalizeArabic(combined));

  // Add phonetic transliteration
  if (isArabic(name)) {
    tokens.add(arabicToLatinPhonetic(name));
  } else {
    tokens.add(latinToArabicPhonetic(name));
  }

  // Find all matched synonyms and add their counterparts
  for (const group of BILINGUAL_SYNONYMS) {
    const hasEn = group.en.some((term) => combined.includes(term));
    const normalizedCombined = normalizeArabic(combined);
    const hasAr = group.ar.some((term) => normalizedCombined.includes(normalizeArabic(term)));

    if (hasEn || hasAr) {
      group.en.forEach((t) => tokens.add(t.toLowerCase()));
      group.ar.forEach((t) => {
        tokens.add(t);
        tokens.add(normalizeArabic(t));
      });
    }
  }

  return Array.from(tokens).join(" ");
}

// ---------------------------------------------------------------------------
// Matcher function for admin search or direct checks
// ---------------------------------------------------------------------------
export function matchesProductBilingual(
  productName: string,
  productDescription: string = "",
  basePrice: number | string = 0,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  // Price match
  const digits = q.replace(/[^\d.]/g, "");
  if (digits) {
    const rawPrice = String(basePrice);
    const fixedPrice = Number(basePrice).toFixed(2);
    if (rawPrice.includes(digits) || fixedPrice.includes(digits)) {
      return true;
    }
  }

  const normQuery = normalizeArabic(q);
  const normName = normalizeArabic(productName);
  const normDesc = normalizeArabic(productDescription);

  // Direct substring
  if (
    productName.toLowerCase().includes(q) ||
    productDescription.toLowerCase().includes(q) ||
    normName.includes(normQuery) ||
    normDesc.includes(normQuery)
  ) {
    return true;
  }

  // Expand query terms
  const searchTerms = expandSearchTerms(query);
  const haystack = generateProductSearchTokens(productName, productDescription).toLowerCase();
  const normHaystack = normalizeArabic(haystack);

  for (const term of searchTerms) {
    const normTerm = normalizeArabic(term);
    if (haystack.includes(term) || normHaystack.includes(normTerm)) {
      return true;
    }
  }

  return false;
}
