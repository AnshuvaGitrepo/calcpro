// ── safe expression evaluator (recursive-descent parser, no eval / new Function) ──
//
// Grammar (lowest → highest precedence):
//   expr    := term (('+' | '-') term)*          50+10%  → 50 + 50×10% = 55
//   term    := unary (('*' | '/') unary | unary)* implicit ×: 2π, 2(3), 3sin(30), (2)(3)
//   unary   := ('-' | '+') unary | power          -5^2 = -25
//   power   := postfix ('^' unary)?               right-assoc: 2^3^2 = 2^9
//   postfix := primary ('!' | '%')*               (2+3)! = 120
//   primary := number | constant | func '(' expr ')' | '(' expr ')'
// Missing ")" at the end are auto-closed so the live preview works while typing.

export const E_CONST = "ℯ"; // display symbol for Euler's number (keeps "e" free for 1e-7)

const FUNCS = ["asin", "acos", "atan", "sin", "cos", "tan", "sqrt", "cbrt", "log", "ln", "abs", "exp"];

function tokenize(src) {
  const s = src
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/√/g, "sqrt")
    .replace(/∛/g, "cbrt")
    .replace(/\s+/g, "");
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const rest = s.slice(i);
    const num = /^(\d+\.?\d*|\.\d+)(e[+-]\d+)?/.exec(rest);
    if (num) {
      if (s[i + num[0].length] === ".") throw new Error("Invalid number"); // 3..2, 1.2.3
      tokens.push({ t: "num", v: Number(num[0]) });
      i += num[0].length;
      continue;
    }
    const fn = FUNCS.find((f) => rest.startsWith(f));
    if (fn) { tokens.push({ t: "fn", v: fn }); i += fn.length; continue; }
    if (rest.startsWith("pi")) { tokens.push({ t: "num", v: Math.PI }); i += 2; continue; }
    const c = s[i];
    if (c === "π") { tokens.push({ t: "num", v: Math.PI }); i++; continue; }
    if (c === E_CONST || c === "E") { tokens.push({ t: "num", v: Math.E }); i++; continue; }
    if ("+-*/^()!%".includes(c)) { tokens.push({ t: c }); i++; continue; }
    throw new Error(`Unexpected "${c}"`);
  }
  return tokens;
}

function factorial(n) {
  if (!Number.isInteger(n) || n < 0) throw new Error("Invalid factorial");
  if (n > 170) throw new Error("Too large");
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function parse(tokens, isRad) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const toRad = (x) => (isRad ? x : (x * Math.PI) / 180);
  const fromRad = (x) => (isRad ? x : (x * 180) / Math.PI);
  // snap float noise like sin(180°) = 1.2e-16 to 0
  const snap = (v) => (Math.abs(v) < 1e-12 ? 0 : v);
  const fns = {
    sin: (x) => snap(Math.sin(toRad(x))),
    cos: (x) => snap(Math.cos(toRad(x))),
    tan: (x) => {
      if (!isRad && Math.abs(x % 180) === 90) return NaN; // tan(90°) is undefined
      return snap(Math.tan(toRad(x)));
    },
    asin: (x) => fromRad(Math.asin(x)),
    acos: (x) => fromRad(Math.acos(x)),
    atan: (x) => fromRad(Math.atan(x)),
    log: Math.log10, ln: Math.log, sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, exp: Math.exp,
  };

  const startsPrimary = (tk) => tk && (tk.t === "num" || tk.t === "fn" || tk.t === "(");

  // consume ")" — or accept it missing at the very end (auto-close)
  function closeParen() {
    if (peek()?.t === ")") next();
    else if (peek()) throw new Error("Expected )");
  }

  function primary() {
    const tk = next();
    if (!tk) throw new Error("Incomplete");
    if (tk.t === "num") return tk.v;
    if (tk.t === "(") { const v = expr(); closeParen(); return v; }
    if (tk.t === "fn") {
      if (peek()?.t !== "(") throw new Error(`${tk.v} needs (`);
      next();
      const arg = expr();
      closeParen();
      return fns[tk.v](arg);
    }
    throw new Error("Unexpected operator");
  }

  // returns { v, pct } — pct=true when the factor ends in a bare %
  function postfix() {
    let v = primary();
    let pct = false;
    while (peek()?.t === "!" || peek()?.t === "%") {
      if (next().t === "!") { v = factorial(v); pct = false; }
      else { v = v / 100; pct = true; }
    }
    return { v, pct };
  }

  function power() {
    const base = postfix();
    if (peek()?.t === "^") {
      next();
      return { v: Math.pow(base.v, unary().v), pct: false };
    }
    return base;
  }

  function unary() {
    const tk = peek();
    if (tk?.t === "-") { next(); const u = unary(); return { v: -u.v, pct: u.pct }; }
    if (tk?.t === "+") { next(); return unary(); }
    return power();
  }

  function term() {
    let { v, pct } = unary();
    for (;;) {
      const tk = peek();
      if (tk?.t === "*" || tk?.t === "/") {
        next();
        const r = unary().v;
        if (tk.t === "/" && r === 0) throw new Error("Can't divide by 0");
        v = tk.t === "*" ? v * r : v / r;
        pct = false;
      } else if (startsPrimary(tk)) {
        v *= unary().v; // implicit multiplication
        pct = false;
      } else break;
    }
    return { v, pct };
  }

  function expr() {
    let v = term().v;
    while (peek()?.t === "+" || peek()?.t === "-") {
      const op = next().t;
      const r = term();
      const amount = r.pct ? v * r.v : r.v; // 200-10% → 180
      v = op === "+" ? v + amount : v - amount;
    }
    return v;
  }

  if (!tokens.length) throw new Error("Empty");
  const result = expr();
  if (pos < tokens.length) throw new Error("Unexpected input");
  return result;
}

export function formatResult(n) {
  if (Object.is(n, -0)) return "0";
  // 15+ digit numbers switch to scientific notation (1e+20, not a 21-digit string)
  if (Math.abs(n) >= 1e15) return Number(n.toPrecision(12)).toExponential();
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toPrecision(12)));
}

// throws on invalid input; returns "" for empty input
export function evaluateExpression(expr, isRad = false) {
  if (!expr || !expr.trim()) return "";
  const res = parse(tokenize(expr), isRad);
  if (!Number.isFinite(res)) throw new Error(Number.isNaN(res) ? "Undefined" : "Out of range");
  return formatResult(res);
}
