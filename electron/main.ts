import path from 'path';
import { app, BrowserWindow, protocol } from 'electron';
import { createHandler } from 'next-electron-rsc';

let mainWindow: BrowserWindow | null;

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

// ⬇ Next.js handler ⬇

// Resolve Next.js app path for dev/prod
const appPath = app.getAppPath();
// Prefer Electron's packaging flag over NODE_ENV for reliability
const dev = !app.isPackaged;
// With Next.js `output: 'standalone'`, the server bundle lives under `.next/standalone`
// We point `dir` to that root; static assets are served from `.next/static`
const dir = path.join(appPath, '.next', 'standalone');

const { createInterceptor, localhostUrl } = createHandler({
  dev,
  dir,
  protocol,
  debug: true,
  // ... and other Nex.js server options https://nextjs.org/docs/pages/building-your-application/configuring/custom-server
  turbo: true, // optional
});

let stopIntercept: (() => void) | undefined;

// ⬆ Next.js handler ⬆

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 800,
    webPreferences: {
      contextIsolation: true, // protect against prototype pollution
      devTools: true,
    },
  });

  // ⬇ Next.js handler ⬇

  stopIntercept = await createInterceptor({ session: mainWindow.webContents.session });

  // ⬆ Next.js handler ⬆

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    try {
      stopIntercept?.();
    } catch {
      // noop
    }
  });

  // Should be last, after all listeners and menu

  await app.whenReady();

  await mainWindow.loadURL(localhostUrl + '/');

  // App loaded
};

app.on('ready', createWindow);

app.on('window-all-closed', () => app.quit()); // if (process.platform !== 'darwin')

app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && !mainWindow && createWindow());