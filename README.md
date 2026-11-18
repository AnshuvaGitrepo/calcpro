# CalcPro

A calculator, unit converter and live currency converter for Android, Windows and the web.
It works offline; the only network request is for currency rates.

## Features

- **Calculator:** standard and scientific keys (trig in degrees or radians, powers, roots,
  logs, factorial), live preview while typing, saved history, copy result, keyboard input.
- **Units:** length, weight, temperature, area, volume, time and data, converted both ways.
- **Currency:** 20 currencies with live rates from open.er-api.com. Offline, it uses the last
  rates it downloaded, or built-in approximate rates if it has none yet.
- Three themes (Graphite, Paper, Ocean), layouts for small phones, phones turned sideways,
  tablets and desktop windows of any size. The Windows app remembers its window size.
- Android: system bars follow the theme (Android 15 included); the back button closes the
  history sheet, then returns to the calculator, then exits.

## Downloads (version 1.0.2)

| Platform | File | Notes |
|---|---|---|
| Android 7.0 or newer | `CalcPro-1.0.2.apk` | Signed release build. Allow "install unknown apps" for your browser or file manager. |
| Windows 10/11 (64-bit) | `CalcPro-Setup-1.0.2.exe` | Installer with Start menu and desktop shortcuts. |
| Windows 10/11 (64-bit) | `CalcPro-1.0.2-portable.exe` | Runs without installing. |

The Windows files are not code-signed, so SmartScreen shows "Windows protected your PC" the
first time. Choose **More info**, then **Run anyway**.

Each version installs over the previous one on Android (same signing key); settings and history are kept.

## Version history

| Version | Changes |
|---|---|
| 1.0.2 | Landscape phones: display beside a full-height keypad, history as a slide-up sheet, compact header on small phones. A value picked from history now shows in the large display. |
| 1.0.1 | Desktop and tablet windows: unit types wrap instead of being cut off, tabs move to the header, history panel beside the keypad, converter cards side by side. Window size remembered. Android 15: themed status and navigation bars, dark launch screen, back button support. |
| 1.0.0 | New design and themes, Android and Windows apps, saved history, clearer error messages, scientific notation for very large numbers. |

## Build from source

Requires Node.js 20+. Android also needs JDK 21 and the Android SDK; Windows builds run on Windows.

```
npm install
npm run dev            # development server on http://localhost:5173
npm test               # calculator engine tests (51 cases)
npm run lint
npm run build          # web build in dist/

npm run electron       # run the Windows app locally
npm run dist:win       # Windows installer + portable exe in release/

npm run android:sync   # copy the web build into the Android project
cd android && gradlew assembleRelease   # APK in android/app/build/outputs/apk/release/
```

Release APKs are signed with the key in `keys/` (not in git). Keep that key: Android only
installs an update over an existing copy when both are signed with the same key.

Icons for all platforms come from `scripts/make-icons.py` (Python + Pillow):
`python scripts/make-icons.py` for web and Windows, `python scripts/make-icons.py android` for Android.

## Project layout

| Path | What it is |
|---|---|
| `src/App.jsx` | The whole interface: header, tabs, calculator, unit and currency panels |
| `src/icons.jsx` | Stroke icon set |
| `src/utils/calcEngine.js` | Expression parser and evaluator (no `eval`) |
| `src/utils/converters.js` | Unit definitions |
| `src/utils/currency.js` | Rates download, offline cache and fallback rates |
| `src/index.css` | Themes and component styles |
| `electron/main.cjs` | Windows app shell |
| `android/` | Capacitor Android project (includes a small native plugin for system bar colours) |
| `scripts/` | Icon generator and the Android 15 emulator launcher |
| `public/` | PWA manifest, service worker, icons |

## License

Copyright 2026 AnshuvaGitrepo. All rights reserved.
