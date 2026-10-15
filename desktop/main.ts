import { app, BrowserWindow, dialog, Menu, session } from 'electron';
import { join } from 'node:path';

if (process.env.BIBLIOSPHERE_PROFILE) app.setPath('userData', process.env.BIBLIOSPHERE_PROFILE);

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 900,
    minHeight: 680,
    show: false,
    title: 'BiblioSphere',
    backgroundColor: '#253d35',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 24, y: 26 },
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', event => event.preventDefault());
  mainWindow.webContents.on('will-attach-webview', event => event.preventDefault());

  const developmentUrl = process.env.ELECTRON_RENDERER_URL;
  const load = developmentUrl && !app.isPackaged
    ? mainWindow.loadURL(developmentUrl)
    : mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  void load.catch(() => {
    dialog.showErrorBox('BiblioSphere could not open', 'The library could not be loaded. Rebuild the desktop application and try again.');
    app.quit();
  });
}

void app.whenReady().then(() => {
  app.setName('BiblioSphere');
  app.setAboutPanelOptions({
    applicationName: 'BiblioSphere',
    applicationVersion: app.getVersion(),
    credits: 'A personal atlas of books. Built with Electron, TypeScript, and StPageFlip.',
  });
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const connections = app.isPackaged ? "'self'" : "'self' ws://127.0.0.1:* ws://localhost:*";
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src ${connections}; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
        ],
        'X-Content-Type-Options': ['nosniff'],
      },
    });
  });

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' as const }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(!app.isPackaged ? [{ role: 'toggleDevTools' as const }] : []),
      ],
    },
    { role: 'windowMenu' },
  ]));

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});