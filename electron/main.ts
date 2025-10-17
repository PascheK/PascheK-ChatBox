/* eslint-disable @typescript-eslint/no-require-imports */
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { app, BrowserWindow, protocol } from "electron";
import { createHandler } from "next-electron-rsc";

const isPackaged = app.isPackaged;

// 🧠 Charger les variables d'env en dev et en prod (dans .app)
function loadEnv() {
  // 1) Quand packagé, les ressources sont sous process.resourcesPath
  const prodEnv = path.join(process.resourcesPath, ".env.local");
  // 2) En dev, __dirname pointe vers dist-electron ; remonter d'un cran
  const devEnv = path.join(__dirname, "..", ".env.local");

  const candidate = isPackaged && fs.existsSync(prodEnv) ? prodEnv : devEnv;
  dotenv.config({ path: candidate });
  console.log("🔑 .env chargé depuis:", candidate);
}
loadEnv();

// 🔁 Hot reload uniquement en dev
try {
  if (!isPackaged) {
    require("electron-reloader")(module);
    require("electron-debug")({ showDevTools: true });
    console.log("🔁 Electron hot-reload activé");
  }
} catch { /* noop */ }

let mainWindow: BrowserWindow | null;
let stopIntercept: (() => void) | undefined;

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));

// 📁 Chemins Next.js
// En dev: app.getAppPath() = racine du projet
// En prod: app.getAppPath() = app.asar
const appPath = app.getAppPath();
const dev = !isPackaged;

// ✅ En mode standalone, on doit pointer sur `.next/standalone`
const standaloneDir = path.join(appPath, ".next", "standalone");
// (Les assets statiques sont dans `.next/static` à côté de standalone)
const nextDir = standaloneDir;

console.log("📁 Next standalone dir:", nextDir);

const { createInterceptor, localhostUrl } = createHandler({
  dev,
  dir: nextDir,      // <— IMPORTANT
  protocol,
  debug: true,
  turbo: true,
});

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      devTools: true,
    },
  });

  stopIntercept = await createInterceptor({ session: mainWindow.webContents.session });

  mainWindow.once("ready-to-show", () => {
    if (dev && mainWindow) mainWindow.webContents.openDevTools();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    try { stopIntercept?.(); } catch { /* noop */ }
  });

  await app.whenReady();

  // Charge Next
  await mainWindow.loadURL(localhostUrl + "/");
  console.log(`🚀 Next servie sur: ${localhostUrl}`);
}

app.on("ready", createWindow);
app.on("window-all-closed", () => app.quit());
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0 && !mainWindow) createWindow();
});