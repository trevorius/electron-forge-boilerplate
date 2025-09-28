import { BrowserWindow, Menu, app, ipcMain, screen, shell } from 'electron';
import * as path from 'path';
import {
  WindowDimensions,
  buildLicenseUrl,
  buildMacOSMenu,
  buildStartUrl,
  calculateLicenseWindowSize,
  calculateOptimalWindowSize,
  getBasePath,
  getLocaleOrDefault,
  handleWindowAction,
  handleWindowMaximizeToggle,
  handleWindowShow,
  shouldCloseWindow,
  shouldCreateNewWindow,
  shouldFocusExistingWindow,
  shouldQuitApp,
  shouldReturnMainWindowStatus,
  shouldSendWindowEvent,
  shouldSetupMacOSMenu,
  shouldShowWindow,
  valueOrUndefined
} from './main.helpers';

const isDev: boolean = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;
let licenseWindow: BrowserWindow | null = null;
let mainWindowDimensions: WindowDimensions;

function createWindow(): void {
	const primaryDisplay = screen.getPrimaryDisplay();
	const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

	mainWindowDimensions = calculateOptimalWindowSize({ width: screenWidth, height: screenHeight });

	mainWindow = new BrowserWindow({
		width: mainWindowDimensions.width,
		height: mainWindowDimensions.height,
		frame: false,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js')
		},
		icon: path.join(__dirname, '../assets/icon.png'),
		show: false,
		titleBarStyle: 'hidden',
		minWidth: 800,
		minHeight: 600
	});

	const basePath = getBasePath(app.isPackaged, process.resourcesPath, __dirname);
	const startUrl = buildStartUrl(isDev, app.isPackaged, basePath);

	mainWindow.loadURL(startUrl);

	mainWindow.once('ready-to-show', () => {
		handleWindowShow(mainWindow, isDev);
	});

	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	mainWindow.on('maximize', () => {
		handleWindowAction(mainWindow, () => {
			mainWindow!.webContents.send('window-maximized');
		});
	});

	mainWindow.on('unmaximize', () => {
		handleWindowAction(mainWindow, () => {
			mainWindow!.webContents.send('window-unmaximized');
		});
	});
}

function createLicenseWindow(): void {
	if (shouldFocusExistingWindow(licenseWindow)) {
		licenseWindow!.focus();
		return;
	}

	const licenseDimensions = calculateLicenseWindowSize(mainWindowDimensions);

	licenseWindow = new BrowserWindow({
		width: licenseDimensions.width,
		height: licenseDimensions.height,
		maxHeight: licenseDimensions.height,
		frame: false,
		transparent: true,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js')
		},
		icon: path.join(__dirname, '../assets/icon.png'),
		show: false,
		titleBarStyle: 'hidden',
		resizable: false,
		minimizable: true,
		maximizable: false,
		parent: valueOrUndefined<BrowserWindow>(mainWindow),
		modal: false
	});

	const licenseBasePath = getBasePath(app.isPackaged, process.resourcesPath, __dirname);
	const licenseUrl = buildLicenseUrl(isDev, app.isPackaged, licenseBasePath);

	licenseWindow.loadURL(licenseUrl);

	licenseWindow.once('ready-to-show', () => {
		if (shouldShowWindow(licenseWindow)) {
			licenseWindow!.show();
		}
	});

	licenseWindow.on('closed', () => {
		licenseWindow = null;
	});
}

app.whenReady().then(() => {
	createWindow();

	app.on('activate', () => {
		if (shouldCreateNewWindow(BrowserWindow.getAllWindows().length)) {
			createWindow();
		}
	});

	if (shouldSetupMacOSMenu(process.platform)) {
		const template = buildMacOSMenu(app.getName());
		const menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);
	}
});

app.on('window-all-closed', () => {
	if (shouldQuitApp(process.platform)) {
		app.quit();
	}
});

app.on('web-contents-created', (_event, contents) => {
	contents.on('new-window', (event, navigationUrl) => {
		event.preventDefault();
		shell.openExternal(navigationUrl);
	});
});

ipcMain.handle('window-minimize', () => {
	if (shouldSendWindowEvent(mainWindow)) {
		mainWindow!.minimize();
	}
});

ipcMain.handle('window-maximize', () => {
	handleWindowMaximizeToggle(mainWindow);
});

ipcMain.handle('window-close', () => {
	if (shouldCloseWindow(mainWindow)) {
		mainWindow!.close();
	}
});

ipcMain.handle('window-is-maximized', () => {
	return shouldReturnMainWindowStatus(mainWindow) ? mainWindow!.isMaximized() : false;
});

ipcMain.handle('open-license-window', () => {
	createLicenseWindow();
});

ipcMain.handle('get-main-app-locale', async () => {
	return await getLocaleOrDefault(mainWindow);
});

ipcMain.handle('close-license-window', () => {
	if (shouldCloseWindow(licenseWindow)) {
		licenseWindow!.close();
	}
});
