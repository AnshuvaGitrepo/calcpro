import { Capacitor, registerPlugin } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { App as CapApp } from "@capacitor/app";
import { readPref, writePref } from "./theme";

export const isNative = Capacitor.isNativePlatform();

// local Android plugin (android/.../AppShellPlugin.java): theme-coloured system bars
const AppShell = registerPlugin("AppShell");

let hapticsOn = readPref("calc-haptics", "on") === "on";
export const getHaptics = () => hapticsOn;
export function setHapticsPref(on) {
  hapticsOn = on;
  writePref("calc-haptics", on ? "on" : "off");
}

// short tick on key press: Capacitor on Android, Vibration API on mobile web, no-op elsewhere
export function tap() {
  if (!hapticsOn) return;
  if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  else navigator.vibrate?.(8);
}

// keep the Android status and navigation bars in step with the theme (works on Android 15+ too)
export function syncStatusBar(bg, isLight) {
  if (!isNative) return;
  AppShell.setColors({ color: bg, light: isLight }).catch(() => {});
}

// Android back button. Screens can claim it by calling preventDefault() on the "appback" event
// (the history sheet closes itself); otherwise `fallback()` runs. Returns an unsubscribe function.
export function onBackButton(fallback) {
  if (!isNative) return () => {};
  const handle = CapApp.addListener("backButton", () => {
    const ev = new CustomEvent("appback", { cancelable: true });
    window.dispatchEvent(ev);
    if (!ev.defaultPrevented) fallback();
  });
  return () => { handle.then((h) => h.remove()).catch(() => {}); };
}

export const exitApp = () => { CapApp.exitApp().catch(() => {}); };
