// High-Resolution Automotive Photo & Visual Asset Catalog
// Includes guaranteed fallback SVG generators for 100% offline & referrer-safe resilience

// Fallback SVG Generator for reliable offline rendering
export function getFallbackSvg(title = "PitStopPro", subtitle = "Automotive", primaryColor = "#f59e0b", iconEmoji = "🚗") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="50%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#090d16" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.25" />
        <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0" />
      </radialGradient>
      <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="600" height="360" fill="url(#g)" />
    <rect width="600" height="360" fill="url(#grid)" />
    <circle cx="300" cy="160" r="180" fill="url(#glow)" />
    <circle cx="300" cy="140" r="55" fill="rgba(255,255,255,0.06)" stroke="${primaryColor}" stroke-width="2" stroke-dasharray="6,4" />
    <text x="300" y="156" font-size="48" text-anchor="middle" dominant-baseline="central">${iconEmoji}</text>
    <text x="300" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="700" fill="#ffffff" text-anchor="middle">${title}</text>
    <text x="300" y="265" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500" fill="${primaryColor}" text-anchor="middle" letter-spacing="1">${subtitle.toUpperCase()}</text>
    <path d="M 180 305 L 420 305" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <text x="300" y="325" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#94a3b8" text-anchor="middle" letter-spacing="2">PITSTOP PERFORMANCE</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// 1. Vehicle Real Photos by Make / Model
export const VEHICLE_IMAGES = {
  // Toyota
  "toyota_premio": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
  "toyota_axio": "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=600&q=80",
  "toyota_corolla": "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=600&q=80",
  "toyota_prius": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80",
  "toyota_vitz": "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80",
  "toyota_landcruiser": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80",
  "toyota_default": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",

  // Honda
  "honda_vezel": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80",
  "honda_civic": "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=600&q=80",
  "honda_fit": "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80",
  "honda_grace": "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=600&q=80",
  "honda_default": "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=600&q=80",

  // Nissan
  "nissan_leaf": "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80",
  "nissan_xtrail": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80",
  "nissan_default": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",

  // Suzuki
  "suzuki_swift": "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80",
  "suzuki_wagonr": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
  "suzuki_default": "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80",

  // Luxury / European / Others
  "bmw_default": "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=600&q=80",
  "mercedes_default": "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=600&q=80",
  "audi_default": "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=600&q=80",
  "sedan_default": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
  "suv_default": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80",
  "hatchback_default": "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80"
};

export function getVehicleImage(make = "", model = "") {
  const m = (make || "").toLowerCase().trim();
  const mod = (model || "").toLowerCase().trim();
  const key = `${m}_${mod}`;

  if (VEHICLE_IMAGES[key]) return VEHICLE_IMAGES[key];
  if (VEHICLE_IMAGES[`${m}_default`]) return VEHICLE_IMAGES[`${m}_default`];

  if (mod.includes("suv") || mod.includes("cruiser") || mod.includes("prado") || mod.includes("harrier") || mod.includes("x-trail")) {
    return VEHICLE_IMAGES["suv_default"];
  }
  if (mod.includes("swift") || mod.includes("vitz") || mod.includes("fit") || mod.includes("alto") || mod.includes("wagon")) {
    return VEHICLE_IMAGES["hatchback_default"];
  }
  return VEHICLE_IMAGES["sedan_default"];
}

// 2. Services Photos
export const SERVICE_IMAGES = {
  "SRV-PNT-001": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80",
  "SRV-PNT-002": "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&q=80",
  "SRV-WLD-001": "https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=600&q=80",
  "SRV-WLD-002": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
  "SRV-MNT-001": "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=600&q=80",
  "SRV-TYR-001": "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80",
  "SRV-BRK-001": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80",
  "SRV-TNK-001": "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80",
  "SRV-ENG-001": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=600&q=80",
  "SRV-AC-001":  "https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&w=600&q=80",
  "SRV-CHK-001": "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80",
  "SRV-OTH-001": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=600&q=80",
  "SRV-EXP-001": "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=600&q=80"
};

export const CATEGORY_DEFAULT_SERVICE_IMAGES = {
  painting: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80",
  welding: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=600&q=80",
  mechanical: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=600&q=80",
  periodic_maintenance: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=600&q=80",
  wheel_tyre: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80",
  tinkering: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80",
  ac_repair: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&w=600&q=80",
  electrical: "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=600&q=80"
};

export function getServiceImage(serviceCode = "", category = "mechanical", name = "Garage Service") {
  if (SERVICE_IMAGES[serviceCode]) return SERVICE_IMAGES[serviceCode];
  if (CATEGORY_DEFAULT_SERVICE_IMAGES[category]) return CATEGORY_DEFAULT_SERVICE_IMAGES[category];
  return "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=600&q=80";
}

// 3. Store Inventory & Spare Parts Photos
export const ITEM_IMAGES = {
  "OIL-5W30-1L":     "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=500&q=80",
  "FLT-OIL-001":     "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=500&q=80",
  "FLT-AIR-001":     "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?auto=format&fit=crop&w=500&q=80",
  "BRK-PAD-F001":    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=500&q=80",
  "BRK-DSC-F001":    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=500&q=80",
  "SPRK-NGK-B6S":    "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=500&q=80",
  "BELT-TIMING":     "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=500&q=80",
  "COOLANT-1L":      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=500&q=80",
  "PAINT-WHT-1L":    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=500&q=80",
  "PAINT-BLK-1L":    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=500&q=80",
  "PAINT-SLV-1L":    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=500&q=80",
  "WELD-ROD":        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=500&q=80",
  "GREASE-1KG":      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80",
  "CLNT-FLD-1L":     "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=500&q=80",
  "TYR-195-65-R15":  "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=500&q=80",
  "TYR-205-55-R16":  "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=500&q=80",
  "SPW-15IN-ALLOY":  "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=500&q=80",
  "VALV-TYR-TR414":  "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=500&q=80",
  "WGT-BAL-100G":    "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=500&q=80"
};

export const SERVICE_PHOTO_PRESETS = [
  { label: "🎨 Painting & 2K Clear", category: "painting", url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80" },
  { label: "🔥 Chassis & Exhaust Welding", category: "welding", url: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=600&q=80" },
  { label: "⚙️ Engine Overhaul & Timing", category: "mechanical", url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=600&q=80" },
  { label: "🛢️ Periodic Lube & Filter", category: "periodic_maintenance", url: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=600&q=80" },
  { label: "🛞 Tyre Replace & Alignment", category: "wheel_tyre", url: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80" },
  { label: "🛑 Brake Disc & Caliper", category: "mechanical", url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80" },
  { label: "🔨 Dent Pulling & Tinkering", category: "tinkering", url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80" },
  { label: "❄️ A/C Gas & Cooling", category: "ac_repair", url: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&w=600&q=80" },
  { label: "🔍 Full Vehicle Inspection", category: "periodic_maintenance", url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80" }
];

export const ITEM_PHOTO_PRESETS = [
  { label: "🛢️ Engine Oil 5W-30", category: "consumable", url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=500&q=80" },
  { label: "🛞 Tyres & Alloy Rim", category: "spare_part", url: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=500&q=80" },
  { label: "🛑 Brake Disc & Pads", category: "spare_part", url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=500&q=80" },
  { label: "⚡ Spark Plugs NGK", category: "spare_part", url: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=500&q=80" },
  { label: "🎨 2K Paint White/Black", category: "paint", url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=500&q=80" },
  { label: "🔥 Welding Rods & Gas", category: "consumable", url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=500&q=80" },
  { label: "🔧 Workshop Tools", category: "tool", url: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=500&q=80" }
];

export function getItemImage(itemCode = "", category = "spare_part", name = "Spare Part") {
  if (ITEM_IMAGES[itemCode]) return ITEM_IMAGES[itemCode];
  if (category === "consumable" || category === "paint") {
    return "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=500&q=80";
  }
  return "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=500&q=80";
}
