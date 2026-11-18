// Small stroke icon set (24x24 grid, 1.8 stroke). Drawn for CalcPro; inherits currentColor.
function Svg({ size = 22, children, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export function IconCalc(p) {
  return <Svg {...p}><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M8.5 7h7M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15v2.5M8.5 18h3.5" /></Svg>;
}
export function IconRuler(p) {
  return <Svg {...p}><path d="M3.5 15.5 15.5 3.5l5 5-12 12z" /><path d="m7 12 1.8 1.8M9.8 9.2l1.4 1.4M12.6 6.4l1.8 1.8" /></Svg>;
}
export function IconCoins(p) {
  return <Svg {...p}><ellipse cx="9" cy="7" rx="5.5" ry="2.5" /><path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V7" /><path d="M9.5 16.3c.9.4 2.1.7 3.5.7 3 0 5.5-1.1 5.5-2.5v-4c0-1-1.2-1.8-3-2.2" /><path d="M18.5 14.5v3c0 1.4-2.5 2.5-5.5 2.5-1.6 0-3-.3-4-.8" /></Svg>;
}
export function IconHistory(p) {
  return <Svg {...p}><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" /><path d="M3.5 4v3.5H7M12 7.5V12l3 2" /></Svg>;
}
export function IconCopy(p) {
  return <Svg {...p}><rect x="8.5" y="8.5" width="11" height="11" rx="2.5" /><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" /></Svg>;
}
export function IconCheck(p) {
  return <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>;
}
export function IconVibrate(p) {
  return <Svg {...p}><rect x="8" y="4" width="8" height="16" rx="2" /><path d="M4.5 8v8M19.5 8v8M2 10.5v3M22 10.5v3" /></Svg>;
}
export function IconVibrateOff(p) {
  return <Svg {...p}><rect x="8" y="4" width="8" height="16" rx="2" /><path d="M3 3l18 18" /></Svg>;
}
export function IconSwap(p) {
  return <Svg {...p}><path d="M8 4v15M4.5 15.5 8 19l3.5-3.5M16 20V5M12.5 8.5 16 5l3.5 3.5" /></Svg>;
}
export function IconRefresh(p) {
  return <Svg {...p}><path d="M20 12a8 8 0 1 1-2.4-5.7" /><path d="M20 4v4.5h-4.5" /></Svg>;
}
export function IconBackspace(p) {
  return <Svg {...p}><path d="M8.5 5H20a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H8.5L2.5 12z" /><path d="m11.5 9.5 5 5M16.5 9.5l-5 5" /></Svg>;
}
export function IconClose(p) {
  return <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
}
export function IconTrash(p) {
  return <Svg {...p}><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9L17.5 7" /></Svg>;
}
export function IconWifiOff(p) {
  return <Svg {...p}><path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 12.5a10 10 0 0 1 4.6-2.5M14.6 10.1A10 10 0 0 1 19 12.5M2 9a15 15 0 0 1 4.2-2.6M11 5.5A15 15 0 0 1 22 9M12 20h.01" /></Svg>;
}
