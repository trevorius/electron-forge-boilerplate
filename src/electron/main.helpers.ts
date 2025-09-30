export interface WindowDimensions {
	width: number;
	height: number;
}

export interface ScreenInfo {
	width: number;
	height: number;
}

export function valueOrUndefined<T>(value: T | null): T | undefined {
	return value ?? undefined;
}

export function calculateOptimalWindowSize(
	screenInfo: ScreenInfo,
	maxWidth: number = 2300,
	maxHeight: number = 1200
): WindowDimensions {
	const { width: screenWidth, height: screenHeight } = screenInfo;

	const MainWindowHeight = Math.min(maxHeight, screenHeight - 100);
	const MainWindowWidth = Math.min(maxWidth, screenWidth - 100);

	return {
		width: MainWindowWidth,
		height: MainWindowHeight
	};
}

export function calculateLicenseWindowSize(
	mainWindowDimensions: WindowDimensions,
	scaleFactor: number = 0.75
): WindowDimensions {
	return {
		width: mainWindowDimensions.width * scaleFactor,
		height: mainWindowDimensions.height * scaleFactor
	};
}

export function buildStartUrl(isDev: boolean, isPackaged: boolean, basePath: string): string {
	if (isDev) {
		return 'http://localhost:5173';
	}

	const distPath = isPackaged
		? `${basePath}/dist-react/index.html`
		: `${basePath}/../dist-react/index.html`;

	return `file://${distPath}`;
}

export function buildLicenseUrl(isDev: boolean, isPackaged: boolean, basePath: string): string {
	if (isDev) {
		return 'http://localhost:5173/license.html';
	}

	const distPath = isPackaged
		? `${basePath}/dist-react/license.html`
		: `${basePath}/../dist-react/license.html`;

	return `file://${distPath}`;
}

export function buildMacOSMenu(appName: string): Electron.MenuItemConstructorOptions[] {
	return [
		{
			label: appName,
			submenu: [
				{ role: 'about' },
				{ type: 'separator' },
				{ role: 'services' },
				{ type: 'separator' },
				{ role: 'hide' },
				{ role: 'hideOthers' },
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
				{ role: 'selectAll' }
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
}

export function shouldOpenDevTools(isDev: boolean): boolean {
	return isDev;
}

export function shouldShowWindow(window: any): boolean {
	return window !== null && window !== undefined;
}

export function shouldSendWindowEvent(window: any): boolean {
	return window !== null && window !== undefined;
}

export function shouldQuitApp(platform: string): boolean {
	return platform !== 'darwin';
}

export function shouldSetupMacOSMenu(platform: string): boolean {
	return platform === 'darwin';
}

export function shouldCreateNewWindow(windowCount: number): boolean {
	return windowCount === 0;
}

export function shouldFocusExistingWindow(window: any): boolean {
	return window !== null && window !== undefined;
}

export function shouldReturnMainWindowStatus(window: any): boolean {
	return window !== null && window !== undefined;
}

export function shouldExecuteJavaScript(window: any): boolean {
	return window !== null && window !== undefined && window.webContents !== null;
}

export function shouldCloseWindow(window: any): boolean {
	return window !== null && window !== undefined;
}

export function getBasePath(isPackaged: boolean, resourcesPath: string, dirname: string): string {
	return isPackaged ? resourcesPath : dirname;
}

export function handleWindowAction(window: any, action: () => void): void {
	if (shouldSendWindowEvent(window)) {
		action();
	}
}

export function handleWindowShow(window: any, isDev: boolean): void {
	if (shouldShowWindow(window)) {
		window.show();

		if (shouldOpenDevTools(isDev)) {
			window.webContents.openDevTools();
		}
	}
}

export function handleWindowMaximizeToggle(window: any): void {
	if (shouldSendWindowEvent(window)) {
		if (window.isMaximized()) {
			window.unmaximize();
		} else {
			window.maximize();
		}
	}
}

export async function getLocaleOrDefault(window: any): Promise<string> {
	if (shouldExecuteJavaScript(window)) {
		try {
			const locale = await window.webContents.executeJavaScript('localStorage.getItem("i18nextLng")');
			return locale || 'en';
		} catch {
			return 'en';
		}
	}
	return 'en';
}

export function logLLMInitializationError(error: Error): void {
	console.error('Failed to initialize LLM service:', error);
}
