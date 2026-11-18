// ── unit converter definitions ──
export const CATEGORIES = {
  length: {
    label: "Length",
    icon: "📏",
    units: {
      mm: { label: "Millimeter", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      cm: { label: "Centimeter", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      m: { label: "Meter", toBase: (v) => v, fromBase: (v) => v },
      km: { label: "Kilometer", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      in: { label: "Inch", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      ft: { label: "Foot", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      yd: { label: "Yard", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      mi: { label: "Mile", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    },
  },
  weight: {
    label: "Weight",
    icon: "⚖️",
    units: {
      mg: { label: "Milligram", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      g: { label: "Gram", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      kg: { label: "Kilogram", toBase: (v) => v, fromBase: (v) => v },
      oz: { label: "Ounce", toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
      lb: { label: "Pound", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
      t: { label: "Tonne", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    },
  },
  temperature: {
    label: "Temperature",
    icon: "🌡️",
    units: {
      C: { label: "Celsius", toBase: (v) => v, fromBase: (v) => v },
      F: { label: "Fahrenheit", toBase: (v) => (v - 32) * 5/9, fromBase: (v) => v * 9/5 + 32 },
      K: { label: "Kelvin", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    },
  },
  area: {
    label: "Area",
    icon: "▦",
    units: {
      "mm²": { label: "Sq Millimeter", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      "cm²": { label: "Sq Centimeter", toBase: (v) => v / 10000, fromBase: (v) => v * 10000 },
      "m²": { label: "Sq Meter", toBase: (v) => v, fromBase: (v) => v },
      "km²": { label: "Sq Kilometer", toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      "in²": { label: "Sq Inch", toBase: (v) => v * 0.00064516, fromBase: (v) => v / 0.00064516 },
      "ft²": { label: "Sq Foot", toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      "ac": { label: "Acre", toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
    },
  },
  volume: {
    label: "Volume",
    icon: "🧪",
    units: {
      ml: { label: "Milliliter", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      l: { label: "Liter", toBase: (v) => v, fromBase: (v) => v },
      "m³": { label: "Cubic Meter", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      cup: { label: "Cup (US)", toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
      gal: { label: "Gallon (US)", toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
      floz: { label: "Fluid Ounce", toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
    },
  },
  time: {
    label: "Time",
    icon: "⏱️",
    units: {
      ms: { label: "Millisecond", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      s: { label: "Second", toBase: (v) => v, fromBase: (v) => v },
      min: { label: "Minute", toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      h: { label: "Hour", toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      d: { label: "Day", toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
      wk: { label: "Week", toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
    },
  },
  data: {
    label: "Data",
    icon: "💾",
    units: {
      B: { label: "Byte", toBase: (v) => v, fromBase: (v) => v },
      KB: { label: "Kilobyte", toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      MB: { label: "Megabyte", toBase: (v) => v * 1024**2, fromBase: (v) => v / 1024**2 },
      GB: { label: "Gigabyte", toBase: (v) => v * 1024**3, fromBase: (v) => v / 1024**3 },
      TB: { label: "Terabyte", toBase: (v) => v * 1024**4, fromBase: (v) => v / 1024**4 },
    },
  },
};

export function convert(value, fromUnit, toUnit, category) {
  const cat = CATEGORIES[category];
  if (!cat) return NaN;
  const from = cat.units[fromUnit];
  const to = cat.units[toUnit];
  if (!from || !to) return NaN;
  const base = from.toBase(Number(value));
  return to.fromBase(base);
}
