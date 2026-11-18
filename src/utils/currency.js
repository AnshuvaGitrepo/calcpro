const CURRENCIES = [
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "CHF", name: "Swiss Franc", flag: "🇨🇭" },
  { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳" },
  { code: "SEK", name: "Swedish Krona", flag: "🇸🇪" },
  { code: "NZD", name: "New Zealand Dollar", flag: "🇳🇿" },
  { code: "MXN", name: "Mexican Peso", flag: "🇲🇽" },
  { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬" },
  { code: "HKD", name: "Hong Kong Dollar", flag: "🇭🇰" },
  { code: "NOK", name: "Norwegian Krone", flag: "🇳🇴" },
  { code: "KRW", name: "South Korean Won", flag: "🇰🇷" },
  { code: "TRY", name: "Turkish Lira", flag: "🇹🇷" },
  { code: "AED", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "BRL", name: "Brazilian Real", flag: "🇧🇷" },
  { code: "ZAR", name: "South African Rand", flag: "🇿🇦" },
];

// approximate USD rates (mid-2026) — used only when offline with no cached rates
const FALLBACK_RATES = {
  USD: 1, EUR: 0.86, GBP: 0.74, JPY: 147, INR: 88, AUD: 1.53, CAD: 1.38,
  CHF: 0.8, CNY: 7.15, SEK: 9.5, NZD: 1.7, MXN: 18.5, SGD: 1.29, HKD: 7.8,
  NOK: 10.1, KRW: 1390, TRY: 41, AED: 3.6725, BRL: 5.4, ZAR: 17.6,
};

const CACHE_KEY = "calc-rates-usd";

export { CURRENCIES, FALLBACK_RATES };

// USD-based rates. source: "live" (just fetched) | "cached" (last good fetch) | "fallback" (built-in)
export async function fetchRates() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
    if (!res.ok) throw new Error("bad status");
    const data = await res.json();
    if (data.result !== "success" || !data.rates) throw new Error("bad payload");
    const out = { rates: data.rates, source: "live", updated: (data.time_last_update_unix || Date.now() / 1000) * 1000 };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ rates: out.rates, updated: out.updated })); } catch { /* storage blocked */ }
    return out;
  } catch {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached?.rates) return { rates: cached.rates, source: "cached", updated: cached.updated };
    } catch { /* storage blocked or corrupt */ }
    return { rates: FALLBACK_RATES, source: "fallback", updated: null };
  }
}
