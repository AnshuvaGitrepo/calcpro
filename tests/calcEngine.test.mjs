// run: npm test
import { evaluateExpression as ev } from "../src/utils/calcEngine.js";

const cases = [
  ["2+3*4", "14"], ["(2+3)!", "120"], ["5!", "120"], ["-5^2", "-25"], ["(-5)^2", "25"],
  ["2^3^2", "512"], ["2^-1", "0.5"], ["5^(-1)", "0.2"], ["2π", String(Number((2 * Math.PI).toPrecision(12)))],
  ["2(3)", "6"], ["(2)(3)", "6"], ["3sin(30)", "1.5"], ["50+10%", "55"], ["200-10%", "180"],
  ["50*10%", "5"], ["50%", "0.5"], ["10/4", "2.5"], ["0.1+0.2", "0.3"], ["sin(180)", "0"],
  ["cos(60)", "0.5"], ["sqrt(16)", "4"], ["√(16", "4"], ["cbrt(27)", "3"], ["log(1000)", "3"],
  ["ln(ℯ)", "1"], ["2ℯ", String(Number((2 * Math.E).toPrecision(12)))], ["abs(-7)", "7"],
  ["1e-7*10", "0.000001"], ["1e+21", "1e+21"], ["7×8÷2−1", "27"], ["(1+2", "3"], ["", ""],
  // large numbers use scientific notation from 1e15 up
  ["10^20", "1e+20"], ["123456789*1e+9", "1.23456789e+17"], ["999999999999999", "999999999999999"],
  ["-(10^16)", "-1e+16"], ["1e+20/1e+5", "1e+15"],
];
// specific error messages shown to the user
const messages = [["1/0", "Can't divide by 0"], ["5/(3-3)", "Can't divide by 0"], ["0/0", "Can't divide by 0"], ["sqrt(-1)", "Undefined"]];
const errors = ["1/0", "5+", "2**3", "alert(1)", "x", "(-1)!", "tan(90)", "sqrt(-1)", "3..2", ")"];

let fail = 0;
for (const [input, want] of cases) {
  let got;
  try { got = ev(input); } catch (e) { got = `throw: ${e.message}`; }
  if (got !== want) { fail++; console.log(`FAIL  ${input}  → ${got}  (want ${want})`); }
}
for (const input of errors) {
  try { const got = ev(input); fail++; console.log(`FAIL  ${input}  → ${got}  (want error)`); } catch { /* expected */ }
}
for (const [input, want] of messages) {
  let got;
  try { got = `no error: ${ev(input)}`; } catch (e) { got = e.message; }
  if (got !== want) { fail++; console.log(`FAIL  ${input}  → "${got}"  (want "${want}")`); }
}
console.log(fail ? `${fail} failed` : `all ${cases.length + errors.length + messages.length} passed`);
process.exit(fail ? 1 : 0);
