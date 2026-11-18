// CalcPro for Windows: Electron shell around the same web build the Android app uses.
// The app is served from a private app:// scheme (not file://) so it gets a normal secure
// origin: the Content Security Policy, ES modules and saved settings all behave like the web build.
const { app, BrowserWindow, protocol, net, shell, Menu, nativeTheme, screen } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

// window size/position remembered between launches (in the user's app data folder)
const STATE_FILE = () => path.join(app.getPath("userData"), "window-state.json");
const DEFAULT_BOUNDS = { width: 420, height: 760 };

function loadBounds() {
  try {
    const b = JSON.parse(fs.readFileSync(STATE_FILE(), "utf8"));
    if (![b.width, b.height].every(Number.isFinite)) return { bounds: DEFAULT_BOUNDS, maximized: false };
    // only reuse a saved position if it is still on a connected screen
    const onScreen = Number.isFinite(b.x) && Number.isFinite(b.y) && screen.getAllDisplays().some(({ workArea: a }) =>
      b.x >= a.x - 50 && b.y >= a.y - 10 && b.x + 100 <= a.x + a.width && b.y + 50 <= a.y + a.height);
    const bounds = { width: Math.max(340, b.width), height: Math.max(560, b.height) };
    if (onScreen) Object.assign(bounds, { x: b.x, y: b.y });
    return { bounds, maximized: !!b.maximized };
  } catch {
    return { bounds: DEFAULT_BOUNDS, maximized: false };
  }
}

function saveBounds(w) {
  try {
    const maximized = w.isMaximized();
    const b = maximized ? w.getNormalBounds() : w.getBounds();
    fs.writeFileSync(STATE_FILE(), JSON.stringify({ ...b, maximized }));
  } catch { /* not critical */ }
}

const DIST = path.join(__dirname, "..", "dist");
const ORIGIN = "app://calcpro";

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

// one window only: a second launch focuses the running app
if (!app.requestSingleInstanceLock()) app.quit();

let win;

function createWindow() {
  const { bounds, maximized } = loadBounds();
  win = new BrowserWindow({
    ...bounds,
    minWidth: 340,
    minHeight: 560,
    title: "CalcPro",
    backgroundColor: "#17191c",
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  win.removeMenu();
  win.once("ready-to-show", () => { if (maximized) win.maximize(); win.show(); });
  win.on("close", () => saveBounds(win));

  // never open other windows or navigate away from the app; real links go to the browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(ORIGIN)) e.preventDefault();
  });

  win.loadURL(`${ORIGIN}/index.html`);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  nativeTheme.themeSource = "dark";

  // map app://calcpro/<path> to files inside dist/, refusing anything outside it
  protocol.handle("app", (request) => {
    const { pathname } = new URL(request.url);
    const file = path.normalize(path.join(DIST, decodeURIComponent(pathname)));
    if (!file.startsWith(DIST)) return new Response("Not found", { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });

  createWindow();
});

app.on("second-instance", () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

app.on("window-all-closed", () => app.quit());
