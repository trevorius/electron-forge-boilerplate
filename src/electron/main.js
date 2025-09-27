const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
	// Create the browser window
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			enableRemoteModule: false,
			preload: path.join(__dirname, 'preload.js')
		},
		icon: path.join(__dirname, '../assets/icon.png'),
		show: false, // Don't show until ready
		titleBarStyle: 'default'
	});

	// Load the app
	const startUrl = isDev
		? 'http://localhost:5173'
		: `file://${path.join(__dirname, '../dist/index.html')}`;

	mainWindow.loadURL(startUrl);

	// Show window when ready to prevent visual flash
	mainWindow.once('ready-to-show', () => {
		mainWindow.show();

		// Open DevTools in development
		if (isDev) {
			mainWindow.webContents.openDevTools();
		}
	});

	// Handle window closed
	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	// Handle external links
	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		require('electron').shell.openExternal(url);
		return { action: 'deny' };
	});
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
	createWindow();

	// On macOS, re-create window when dock icon is clicked
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});

	// Set up application menu
	if (process.platform === 'darwin') {
		const template = [
			{
				label: app.getName(),
				submenu: [
					{ role: 'about' },
					{ type: 'separator' },
					{ role: 'services' },
					{ type: 'separator' },
					{ role: 'hide' },
					{ role: 'hideothers' },
					{ role: 'unhide' },
					{ type: 'separator' },
					{ role: 'quit' }
				]
			},
			{
				label: 'Edit',
				submenu: [
					{ role: 'undo' },
					{ role: 'redo' },
					{ type: 'separator' },
					{ role: 'cut' },
					{ role: 'copy' },
					{ role: 'paste' },
					{ role: 'selectall' }
				]
			},
			{
				label: 'View',
				submenu: [
					{ role: 'reload' },
					{ role: 'forceReload' },
					{ role: 'toggleDevTools' },
					{ type: 'separator' },
					{ role: 'resetZoom' },
					{ role: 'zoomIn' },
					{ role: 'zoomOut' },
					{ type: 'separator' },
					{ role: 'togglefullscreen' }
				]
			},
			{
				label: 'Window',
				submenu: [
					{ role: 'minimize' },
					{ role: 'close' }
				]
			}
		];

		const menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);
	}
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
	// On macOS, keep app running even when all windows are closed
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
	contents.on('new-window', (event, navigationUrl) => {
		event.preventDefault();
		require('electron').shell.openExternal(navigationUrl);
	});
});
