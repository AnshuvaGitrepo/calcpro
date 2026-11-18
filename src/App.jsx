import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import { evaluateExpression, E_CONST } from "./utils/calcEngine";
import { CATEGORIES, convert } from "./utils/converters";
import { CURRENCIES, fetchRates } from "./utils/currency";
import { THEMES, useTheme, readPref, writePref } from "./utils/theme";
import { tap, getHaptics, setHapticsPref, syncStatusBar, isNative, onBackButton, exitApp } from "./utils/native";
import {
  IconCalc, IconRuler, IconCoins, IconHistory, IconCopy, IconCheck, IconVibrate, IconVibrateOff,
  IconSwap, IconRefresh, IconBackspace, IconClose, IconTrash, IconWifiOff,
} from "./icons";

const TABS = [
  { id: "calculator", label: "Calculator", Icon: IconCalc },
  { id: "converter",  label: "Units",      Icon: IconRuler },
  { id: "currency",   label: "Currency",   Icon: IconCoins },
];

// vibration only makes sense on touch devices (desktop Chrome/Electron expose a no-op API)
const CAN_VIBRATE = isNative || (typeof window !== "undefined" && "vibrate" in navigator && window.matchMedia?.("(pointer: coarse)").matches);

// tidy a converted number for display
const fmt = (n) => (Number.isFinite(n) ? String(Number(n.toPrecision(10))) : "");

// font size that makes `text` fit the element's width (digits are ~0.6em wide in Manrope)
function useFitText(text, max, min) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const len = Math.max(1, String(text).length);
  const size = width ? Math.max(min, Math.min(max, width / (len * 0.62))) : max;
  return [ref, size];
}

// ── Header ──────────────────────────────────────────────
function Header({ theme, setTheme, tab, setTab }) {
  return (
    <header className="relative z-20" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="h-14 land:h-12 px-4 wide:px-8 flex items-center gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-[10px] grid place-items-center shrink-0" style={{ background: "var(--accent)", color: "var(--on-accent)" }} aria-hidden>
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 5.5h10M3 10.5h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </div>
          <span className="font-extrabold text-[17px] tracking-tight">CalcPro</span>
        </div>

        {/* tabs live in the header on wide windows and phones in landscape */}
        <nav className="hidden mid:flex land:flex mx-auto p-1 rounded-full" style={{ background: "var(--surface)", boxShadow: "inset 0 0 0 1px var(--line)" }} aria-label="Sections">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} aria-label={label} title={label}
              className="h-9 px-4 tightland:px-3 rounded-full flex items-center gap-2 text-[13px] font-bold transition-colors"
              style={tab === id ? { background: "var(--key)", color: "var(--text)", boxShadow: "0 1px 2px var(--shadow)" } : { color: "var(--muted)" }}>
              {/* narrow landscape phones: icons only so the header fits */}
              <Icon size={17} /><span className="tightland:hidden">{label}</span>
            </button>
          ))}
        </nav>

        <div className="ml-auto mid:ml-0 land:ml-0 flex items-center gap-1" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => (
            <button key={t.id} onClick={() => setTheme(t.id)} role="radio" aria-checked={theme === t.id} aria-label={`${t.label} theme`} title={t.label}
              className="w-10 h-10 grid place-items-center rounded-full">
              <span className="w-[22px] h-[22px] rounded-full grid place-items-center transition-transform"
                style={{ background: t.bg, boxShadow: theme === t.id ? `0 0 0 2px var(--bg), 0 0 0 4px ${t.accent}` : "inset 0 0 0 1px var(--line)", transform: theme === t.id ? "scale(1)" : "scale(.86)" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: t.accent }} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

// bottom tab bar on phones (portrait) and narrow windows
function TabBar({ tab, setTab }) {
  return (
    <nav className="mid:hidden land:hidden relative z-20" style={{ paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "0 -1px 0 var(--line)" }} aria-label="Sections">
      <div className="flex max-w-[480px] mx-auto px-3 py-1.5">
        {TABS.map(({ id, label, Icon }) => {
          const on = tab === id;
          return (
            <button key={id} onClick={() => { tap(); setTab(id); }} aria-current={on ? "page" : undefined}
              className="flex-1 h-14 flex flex-col items-center justify-center gap-1 text-[11.5px] font-bold"
              style={{ color: on ? "var(--text)" : "var(--muted)" }}>
              <span className="h-7 w-14 rounded-full grid place-items-center transition-colors" style={{ background: on ? "var(--surface)" : "transparent", color: on ? "var(--accent)" : "inherit" }}>
                <Icon size={20} />
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── Calculator ──────────────────────────────────────────
const SCI_KEYS = [
  ["sin", "sin("], ["cos", "cos("], ["tan", "tan("], ["log", "log("], ["ln", "ln("],
  ["sin⁻¹", "asin("], ["cos⁻¹", "acos("], ["tan⁻¹", "atan("], ["√", "sqrt("], ["∛", "cbrt("],
  ["x²", "^2"], ["xʸ", "^"], ["1/x", "^(-1)"], ["n!", "!"], ["|x|", "abs("],
  ["(", "("], [")", ")"], ["π", "π"], ["e", E_CONST], ["eˣ", "exp("],
];
const SCI_ARIA = { "sin⁻¹": "arcsine", "cos⁻¹": "arccosine", "tan⁻¹": "arctangent", "√": "square root", "∛": "cube root", "x²": "square", "xʸ": "power", "1/x": "reciprocal", "n!": "factorial", "|x|": "absolute value", "e": "Euler's number", "eˣ": "e to the power", "(": "open bracket", ")": "close bracket", "π": "pi" };

const MAIN_KEYS = [
  ["C", "func", "Clear"], ["⌫", "func", "Backspace"], ["%", "func", "Percent"], ["÷", "op", "Divide"],
  ["7"], ["8"], ["9"], ["×", "op", "Multiply"],
  ["4"], ["5"], ["6"], ["−", "op", "Minus"],
  ["1"], ["2"], ["3"], ["+", "op", "Plus"],
  ["±", "func", "Change sign"], ["0"], ["."], ["=", "eq", "Equals"],
];

// operator symbols drawn as paths so they sit exactly centred on the key in every font
const OP_ICONS = {
  "÷": "M5 12h14M12 6.5h.01M12 17.5h.01",
  "×": "M6.5 6.5l11 11M17.5 6.5l-11 11",
  "−": "M5 12h14",
  "+": "M5 12h14M12 5v14",
  "=": "M5 9h14M5 15h14",
};
function OpGlyph({ d }) {
  return (
    <svg viewBox="0 0 24 24" className="w-[0.8em] h-[0.8em]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const BINARY = ["+", "−", "×", "÷", "^"];
const LAST_NUM = /(\d+\.?\d*(?:e[+-]\d+)?|\.\d+|π|ℯ)$/;
const NEG_LAST_NUM = /\(−(\d+\.?\d*(?:e[+-]\d+)?|\.\d+|π|ℯ)\)$/;
// keys that start a new expression when pressed right after "="
const STARTS_FRESH = /^([0-9.(π]|ℯ|[a-z]+\()/;
const KEYBOARD_MAP = { "*": "×", "x": "×", "X": "×", "/": "÷", "-": "−", "p": "π", "e": E_CONST };

const toggleSign = (s) => {
  if (!s) return "(−";
  if (NEG_LAST_NUM.test(s)) return s.replace(NEG_LAST_NUM, "$1");
  if (/^-[\d.e+-]+$/.test(s)) return s.slice(1); // negative result from "="
  if (LAST_NUM.test(s)) return s.replace(LAST_NUM, "(−$1)");
  return s + "(−";
};

function loadHistory() {
  try {
    const h = JSON.parse(readPref("calc-history", "[]"));
    return Array.isArray(h) ? h.filter((x) => x && typeof x.expr === "string" && typeof x.result === "string").slice(0, 50) : [];
  } catch { return []; }
}

function HistoryList({ history, onPick, onClear, onClose }) {
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between h-12 px-1 shrink-0">
        <h2 className="font-extrabold text-[15px] px-2">History</h2>
        <div className="flex items-center">
          {history.length > 0 && <button className="tool" onClick={onClear}><IconTrash size={17} />Clear</button>}
          {onClose && <button className="tool" onClick={onClose} aria-label="Close history"><IconClose size={19} /></button>}
        </div>
      </div>
      <div className="scroll-y flex-1 min-h-0 px-1 pb-2">
        {history.length === 0 && (
          <p className="px-2 py-3 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
            Finished calculations appear here. Tap one to use its result again.
          </p>
        )}
        {history.map((h, i) => (
          <button key={`${i}-${h.expr}`} onClick={() => onPick(h)}
            className="w-full text-right px-3 py-2.5 rounded-xl flex flex-col items-end gap-0.5 transition-colors hover:bg-[var(--surface)]">
            <span className="text-[13px] max-w-full truncate" style={{ color: "var(--muted)" }}>{h.expr}</span>
            <span className="text-[18px] font-bold max-w-full truncate">{h.result}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CalculatorPanel() {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState(loadHistory);
  const [sheet, setSheet] = useState(false);
  const [scientific, setScientific] = useState(() => readPref("calc-sci", "off") === "on");
  const [isRad, setIsRad] = useState(() => readPref("calc-angle", "deg") === "rad");
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [haptics, setHaptics] = useState(getHaptics);
  const [copied, setCopied] = useState(false);
  const exprRef = useRef(null);

  useEffect(() => { writePref("calc-sci", scientific ? "on" : "off"); }, [scientific]);
  useEffect(() => { writePref("calc-angle", isRad ? "rad" : "deg"); }, [isRad]);
  useEffect(() => { writePref("calc-history", JSON.stringify(history)); }, [history]);
  // Android back button closes the history sheet before anything else
  useEffect(() => {
    if (!sheet) return;
    const close = (e) => { e.preventDefault(); setSheet(false); };
    window.addEventListener("appback", close);
    return () => window.removeEventListener("appback", close);
  }, [sheet]);
  // keep the end of a long expression in view
  useEffect(() => { const el = exprRef.current; if (el) el.scrollLeft = el.scrollWidth; }, [expr]);

  const preview = useMemo(() => {
    if (!expr || justEvaluated) return "";
    try { const r = evaluateExpression(expr, isRad); return r === expr ? "" : r; } catch { return ""; }
  }, [expr, isRad, justEvaluated]);

  const evaluate = useCallback(() => {
    if (!expr.trim()) return;
    try {
      const r = evaluateExpression(expr, isRad);
      if (r !== expr) setHistory((h) => [{ expr, result: r }, ...h].slice(0, 50));
      setResult(r);
      setError("");
      setExpr(r);
      setJustEvaluated(true);
    } catch (e) {
      setResult("");
      setError(e.message === "Incomplete" || e.message === "Empty" ? "Finish the expression first" : e.message);
      setJustEvaluated(false);
    }
  }, [expr, isRad]);

  const input = useCallback((v) => {
    if (v === "C") { setExpr(""); setResult(""); setError(""); setJustEvaluated(false); return; }
    if (v === "⌫") {
      setExpr((s) => s.replace(/(asin|acos|atan|sin|cos|tan|sqrt|cbrt|log|ln|abs|exp)\($|.$/u, ""));
      setResult(""); setError(""); setJustEvaluated(false);
      return;
    }
    if (v === "=") { evaluate(); return; }
    setResult(""); setError("");
    if (v === "±") { setExpr(toggleSign); setJustEvaluated(false); return; }
    setExpr((s) => {
      if (justEvaluated && STARTS_FRESH.test(v)) return v;
      // (-5)² not -5² when squaring a negative result
      if (justEvaluated && s.startsWith("-") && /^[\^!%]/.test(v)) return `(${s})${v}`;
      if (!s && ["+", "×", "÷", "^", "!", "%"].includes(v[0])) return s; // nothing to operate on
      const last = s.slice(-1);
      // replace a dangling binary operator (but allow × − / ÷ − / ^ − for negatives)
      if (BINARY.includes(last) && BINARY.includes(v) && !(v === "−" && last !== "−" && last !== "+")) return s.slice(0, -1) + v;
      return s + v;
    });
    setJustEvaluated(false);
  }, [evaluate, justEvaluated]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target?.tagName)) return;
      const k = e.key;
      if (k === "Enter" || k === "=") { e.preventDefault(); input("="); }
      else if (k === "Escape") { if (sheet) setSheet(false); else input("C"); }
      else if (k === "Delete") input("C");
      else if (k === "Backspace") { e.preventDefault(); input("⌫"); }
      else if (KEYBOARD_MAP[k]) input(KEYBOARD_MAP[k]);
      else if (/^[0-9+().%^!]$/.test(k)) input(k);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [input, sheet]);

  const copyResult = async () => {
    const val = result || preview || expr;
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* clipboard blocked */ }
  };

  const pickHistory = (h) => { setExpr(h.result); setResult(""); setError(""); setJustEvaluated(true); setSheet(false); };
  const toggleHaptics = () => { setHapticsPref(!haptics); setHaptics(!haptics); };

  // a value reused from history (justEvaluated, no fresh result) still shows large
  const bigText = error || result || preview || (justEvaluated ? expr : "") || (expr ? "" : "0");
  const [bigRef, bigSize] = useFitText(bigText || "0", error ? 30 : 68, error ? 18 : 26);

  const press = (v) => { tap(); input(v); };

  return (
    <div className="h-full flex justify-center gap-6 px-3 pb-3 mid:px-6 mid:pb-6 wide:px-8 wide:pb-8 mid:pt-2 land:pb-2">
      {/* keypad column: phone width on small screens, grows a little on wide windows */}
      {/* portrait: toolbar + display above the keypad; landscape phones: display left, keypad right at full height */}
      <section className="relative h-full w-full max-w-[460px] wide:max-w-[520px] land:max-w-none flex flex-col land:flex-row land:gap-3 min-h-0" aria-label="Calculator">
        <div className="flex flex-col flex-[1_1_0] min-h-[132px] land:min-h-0 land:flex-[0_0_34%] min-w-0">
        {/* toolbar */}
        <div className="flex items-center gap-1 h-11 land:h-9 shrink-0">
          <button className="tool" aria-pressed={scientific} onClick={() => setScientific((v) => !v)} aria-label="Scientific keys">
            <span className="tightland:hidden">Scientific</span><span className="hidden tightland:inline">Sci</span>
          </button>
          {scientific && (
            <button className="tool" onClick={() => setIsRad((v) => !v)} aria-label={`Angle unit: ${isRad ? "radians" : "degrees"}. Switch`}>
              {isRad ? "Rad" : "Deg"}
            </button>
          )}
          <div className="ml-auto flex items-center">
            {CAN_VIBRATE && (
              <button className="tool" aria-pressed={haptics} onClick={toggleHaptics} aria-label="Vibrate on key press" title="Vibrate on key press">
                {haptics ? <IconVibrate size={19} /> : <IconVibrateOff size={19} />}
              </button>
            )}
            <button className="tool" onClick={copyResult} aria-label="Copy result" title="Copy result">
              {copied ? <IconCheck size={19} style={{ color: "var(--accent)" }} /> : <IconCopy size={19} />}
            </button>
            <button className="tool side:hidden land:inline-flex" onClick={() => setSheet(true)} aria-label="History" title="History">
              <IconHistory size={19} />{history.length > 0 && <span>{history.length}</span>}
            </button>
          </div>
        </div>

        {/* display: takes whatever height the keypad leaves */}
        <div className="flex-[1_1_0] min-h-0 flex flex-col justify-end px-2 pb-3 land:pb-1 overflow-hidden" aria-live="polite">
          <div ref={exprRef} className="text-right text-[clamp(16px,2.6vh,22px)] font-medium whitespace-nowrap overflow-x-auto scrollbar-hide min-h-[1.5em]"
            style={{ color: justEvaluated ? "var(--dim)" : "var(--muted)" }}>
            {expr}
          </div>
          <div ref={bigRef} className="text-right font-bold tracking-tight whitespace-nowrap overflow-hidden leading-[1.1]" style={{ fontSize: `min(${bigSize}px, var(${error ? "--err-cap" : "--big-cap"}))`, minHeight: "1.1em" }}>
            <span key={result || error} className={result || error ? "result-in inline-block" : undefined}
              style={{ color: error ? "var(--danger)" : result || justEvaluated ? "var(--text)" : "var(--dim)" }}>
              {bigText}
            </span>
          </div>
        </div>
        </div>

        {/* keypad: sci keys above (portrait) or beside (landscape) the main keys */}
        <div className={`min-h-0 flex flex-col land:flex-row gap-2 ${scientific ? "flex-[0_1_74%] max-h-[680px]" : "flex-[0_1_64%] max-h-[520px]"} land:flex-[1_1_0] land:max-h-none land:h-full land:py-1`}>
          {scientific && (
            <div className="flex-[4_1_0] land:flex-[5_1_0] min-h-0 grid grid-cols-5 grid-rows-4 gap-1" style={{ "--key-radius": "12px" }}>
              {SCI_KEYS.map(([label, val]) => (
                <button key={label} className="key key-sci text-[clamp(13px,1.9vh,16px)]" aria-label={SCI_ARIA[label] ?? label} onClick={() => press(val)}>{label}</button>
              ))}
            </div>
          )}
          <div className={`${scientific ? "flex-[7_1_0] land:flex-[4_1_0]" : "flex-1"} min-h-0 grid grid-cols-4 grid-rows-5 gap-2`}>
            {MAIN_KEYS.map(([label, kind = "num", aria]) => (
              <button key={label} aria-label={aria ?? label} onClick={() => press(label)}
                className={`key ${kind === "num" ? "" : `key-${kind}`} ${kind === "op" || kind === "eq" ? "text-[clamp(24px,4.2vh,36px)] font-medium" : "text-[clamp(19px,3.1vh,28px)]"} grid place-items-center`}>
                {label === "⌫" ? <IconBackspace size={24} /> : OP_ICONS[label] ? <OpGlyph d={OP_ICONS[label]} /> : label}
              </button>
            ))}
          </div>
        </div>

        {/* history sheet on phones and narrow windows */}
        {sheet && (
          <div className="side:hidden land:flex absolute inset-0 z-10 flex flex-col justify-end" style={{ animation: "fade .15s ease" }}>
            <button className="absolute inset-0 cursor-default" style={{ background: "rgba(0,0,0,.35)" }} aria-label="Close history" onClick={() => setSheet(false)} />
            <div className="relative h-[70%] land:h-[92%] rounded-t-[24px] px-2 pt-1" role="dialog" aria-label="History"
              style={{ background: "var(--surface)", boxShadow: "0 -8px 30px var(--shadow)", animation: "sheet .22s cubic-bezier(.2,.8,.2,1)" }}>
              <HistoryList history={history} onPick={pickHistory} onClear={() => setHistory([])} onClose={() => setSheet(false)} />
            </div>
          </div>
        )}
      </section>

      {/* history panel beside the keypad on wide windows */}
      <aside className="hidden side:flex land:hidden w-[240px] wide:w-[300px] shrink-0 flex-col min-h-0 field px-2 py-1" aria-label="History">
        <HistoryList history={history} onPick={pickHistory} onClear={() => setHistory([])} />
      </aside>
    </div>
  );
}

// ── shared converter pieces ─────────────────────────────
// accept digits, one dot, leading minus; "," treated as "."
const cleanNumber = (raw) => raw.replace(",", ".").replace(/[^0-9.-]/g, "").replace(/(?!^)-/g, "").replace(/(\..*)\./g, "$1");

function Field({ label, select, children }) {
  return (
    <div className="field p-4 side:p-5 side:flex-1 min-w-0">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[13px] font-bold shrink-0" style={{ color: "var(--muted)" }}>{label}</span>
        <div className="min-w-0 flex-1 flex justify-end">{select}</div>
      </div>
      {children}
    </div>
  );
}

function SwapButton({ onClick, label }) {
  return (
    // overlaps the two cards: between them vertically on phones, horizontally on wide windows
    <div className="flex justify-center -my-3.5 side:my-0 side:-mx-3.5 side:self-center relative z-10 shrink-0">
      <button onClick={() => { tap(); onClick(); }} aria-label={label} title={label}
        className="key w-12 h-12 rounded-full grid place-items-center" style={{ "--key-radius": "999px", background: "var(--accent)", color: "var(--on-accent)", boxShadow: "0 0 0 5px var(--bg)" }}>
        <IconSwap size={21} className="side:rotate-90" />
      </button>
    </div>
  );
}

// From / swap / To: stacked on phones, side by side from 720px
function FieldPair({ children }) {
  return <div className="flex flex-col side:flex-row side:items-stretch">{children}</div>;
}

function BigInput({ value, onChange, label, inputMode = "decimal", accent }) {
  const [ref, size] = useFitText(value || "0", 48, 20);
  return (
    <div ref={ref} className="min-w-0">
      <input value={value} onChange={onChange} onFocus={(e) => e.target.select()}
        inputMode={inputMode} enterKeyHint="done" autoComplete="off" aria-label={label} placeholder="0"
        className="w-full bg-transparent font-bold tracking-tight leading-tight placeholder:text-[var(--dim)]"
        style={{ fontSize: size, color: accent ? "var(--accent)" : "var(--text)" }} />
    </div>
  );
}

function PanelScroll({ children }) {
  return (
    // scrolls when the content is taller than the window, otherwise sits centred in it
    <div className="h-full scroll-y flex flex-col px-3 pb-6 mid:px-6 wide:px-8 mid:pt-2">
      <div className="w-full max-w-[520px] side:max-w-[920px] mx-auto side:my-auto flex flex-col gap-4 side:gap-6">{children}</div>
    </div>
  );
}

// ── Unit converter ──────────────────────────────────────
// the most useful starting pair for each unit type
const DEFAULT_PAIRS = {
  length: ["m", "ft"], weight: ["kg", "lb"], temperature: ["C", "F"], area: ["m²", "ft²"],
  volume: ["l", "gal"], time: ["h", "min"], data: ["GB", "MB"],
};
function pairFor(cat) {
  const units = Object.keys(CATEGORIES[cat].units);
  const pair = DEFAULT_PAIRS[cat];
  return pair && pair.every((u) => units.includes(u)) ? pair : [units[0], units[1] || units[0]];
}

function ConverterPanel() {
  const cats = Object.keys(CATEGORIES);
  const [cat, setCat] = useState(() => (CATEGORIES[readPref("calc-unit-cat", "length")] ? readPref("calc-unit-cat", "length") : "length"));
  const [from, setFrom] = useState(() => pairFor(cat)[0]);
  const [to, setTo] = useState(() => pairFor(cat)[1]);
  // the side being typed in holds the raw value; the other side is derived from it
  const [value, setValue] = useState("1");
  const [side, setSide] = useState("a");

  useEffect(() => { writePref("calc-unit-cat", cat); }, [cat]);

  const pickCat = (k) => {
    const [f, t] = pairFor(k);
    setCat(k); setFrom(f); setTo(t); setValue("1"); setSide("a");
  };

  const valid = value !== "" && value !== "-" && value !== "." && !isNaN(Number(value));
  const derived = valid ? fmt(side === "a" ? convert(value, from, to, cat) : convert(value, to, from, cat)) : "";
  const a = side === "a" ? value : derived;
  const b = side === "b" ? value : derived;
  const swap = () => { setFrom(to); setTo(from); setSide((s) => (s === "a" ? "b" : "a")); };

  const options = Object.entries(CATEGORIES[cat].units).map(([k, v]) => <option key={k} value={k}>{v.label} ({k})</option>);
  const inputMode = cat === "temperature" ? "text" : "decimal"; // Android decimal pads often lack "−"

  return (
    <PanelScroll>
      {/* chips wrap instead of scrolling sideways, so every unit type is visible (mouse users can't swipe) */}
      <div className="flex flex-wrap justify-center gap-2 pt-1" role="tablist" aria-label="Unit type">
        {cats.map((k) => (
          <button key={k} role="tab" aria-selected={cat === k} onClick={() => pickCat(k)}
            className="h-10 px-4 rounded-full text-[13.5px] font-bold transition-colors"
            style={cat === k ? { background: "var(--text)", color: "var(--bg)" } : { background: "var(--surface)", color: "var(--muted)", boxShadow: "inset 0 0 0 1px var(--line)" }}>
            {CATEGORIES[k].label}
          </button>
        ))}
      </div>

      <FieldPair>
        <Field label="From" select={<select className="select" aria-label="From unit" value={from} onChange={(e) => setFrom(e.target.value)}>{options}</select>}>
          <BigInput value={a} label="From value" inputMode={inputMode} onChange={(e) => { setSide("a"); setValue(cleanNumber(e.target.value)); }} />
        </Field>
        <SwapButton onClick={swap} label="Swap units" />
        <Field label="To" select={<select className="select" aria-label="To unit" value={to} onChange={(e) => setTo(e.target.value)}>{options}</select>}>
          <BigInput value={b} label="To value" inputMode={inputMode} accent onChange={(e) => { setSide("b"); setValue(cleanNumber(e.target.value)); }} />
        </Field>
      </FieldPair>

      <p className="text-center text-[13.5px] font-semibold" style={{ color: "var(--muted)" }}>
        1 {from} = {fmt(convert(1, from, to, cat))} {to}
      </p>
    </PanelScroll>
  );
}

// ── Currency ────────────────────────────────────────────
const SOURCE_NOTE = {
  cached: "You're offline. Showing the last rates downloaded",
  fallback: "You're offline and no rates have been downloaded yet. Showing built-in approximate rates",
};

function CurrencyPanel() {
  const [from, setFrom] = useState(() => readPref("calc-cur-from", "USD"));
  const [to, setTo] = useState(() => readPref("calc-cur-to", "INR"));
  const [amt, setAmt] = useState("1");
  const [data, setData] = useState(null); // { rates, source, updated }
  const [loading, setLoading] = useState(true);

  useEffect(() => { writePref("calc-cur-from", from); writePref("calc-cur-to", to); }, [from, to]);

  useEffect(() => {
    let alive = true;
    fetchRates().then((d) => { if (alive) { setData(d); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  const load = async () => {
    setLoading(true);
    setData(await fetchRates());
    setLoading(false);
  };

  const rates = data?.rates;
  const rate = rates && rates[from] && rates[to] ? rates[to] / rates[from] : null;
  const converted = rate != null && amt !== "" && amt !== "." && !isNaN(Number(amt))
    ? Number((Number(amt) * rate).toPrecision(10)).toLocaleString(undefined, { maximumFractionDigits: 4 })
    : "";
  const [outRef, outSize] = useFitText(converted || "0", 48, 20);
  const swap = () => { setFrom(to); setTo(from); };
  const options = CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>);
  const updated = data?.updated ? new Date(data.updated).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : null;

  return (
    <PanelScroll>
      {data && SOURCE_NOTE[data.source] && (
        <div className="field px-4 py-3 flex gap-3 items-start text-[13.5px] leading-snug" role="status">
          <IconWifiOff size={19} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
          <span>{SOURCE_NOTE[data.source]}{data.source === "cached" && updated ? ` (${updated})` : ""}. Tap Refresh when you're back online.</span>
        </div>
      )}

      <FieldPair>
        <Field label="Amount" select={<select className="select" aria-label="From currency" value={from} onChange={(e) => setFrom(e.target.value)}>{options}</select>}>
          <BigInput value={amt} label="Amount" onChange={(e) => setAmt(cleanNumber(e.target.value).replace("-", ""))} />
        </Field>
        <SwapButton onClick={swap} label="Swap currencies" />
        <Field label="Converted" select={<select className="select" aria-label="To currency" value={to} onChange={(e) => setTo(e.target.value)}>{options}</select>}>
          <div ref={outRef} aria-live="polite" className="font-bold tracking-tight leading-tight whitespace-nowrap overflow-hidden" style={{ fontSize: outSize, color: "var(--accent)" }}>
            {converted || (loading ? "…" : "0")}
          </div>
        </Field>
      </FieldPair>

      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-[13px] leading-snug" style={{ color: "var(--muted)" }}>
          {rate != null && <span className="block font-bold" style={{ color: "var(--text)" }}>1 {from} = {Number(rate.toPrecision(6))} {to}</span>}
          {data?.source === "live" && updated ? `Rates from open.er-api.com, updated ${updated}` : loading ? "Getting the latest rates" : ""}
        </p>
        <button className="tool shrink-0" onClick={load} disabled={loading} style={{ background: "var(--surface)", boxShadow: "inset 0 0 0 1px var(--line)" }}>
          <IconRefresh size={17} className={loading ? "animate-spin" : undefined} />{loading ? "Updating" : "Refresh"}
        </button>
      </div>
    </PanelScroll>
  );
}

// ── App ─────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useTheme();
  const [tab, setTab] = useState(() => {
    const saved = readPref("calc-tab", "calculator");
    return TABS.some((t) => t.id === saved) ? saved : "calculator";
  });

  useEffect(() => { writePref("calc-tab", tab); }, [tab]);
  useEffect(() => {
    syncStatusBar(THEMES.find((t) => t.id === theme).bg, theme === "light");
  }, [theme]);

  // Android back: open sheets close first (they claim the event), then back to Calculator, then exit
  const tabRef = useRef(tab);
  useEffect(() => { tabRef.current = tab; }, [tab]);
  useEffect(() => onBackButton(() => {
    if (tabRef.current !== "calculator") setTab("calculator");
    else exitApp();
  }), []);

  return (
    <div className="shell">
      <Header theme={theme} setTheme={setTheme} tab={tab} setTab={setTab} />
      <main className="min-h-0 overflow-hidden">
        {tab === "calculator" && <CalculatorPanel />}
        {tab === "converter" && <ConverterPanel />}
        {tab === "currency" && <CurrencyPanel />}
      </main>
      <TabBar tab={tab} setTab={setTab} />
    </div>
  );
}
