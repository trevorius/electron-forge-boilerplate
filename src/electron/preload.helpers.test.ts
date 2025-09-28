import {
	createElectronAPI,
	createNodeAPI,
	getPlatform
} from './preload.helpers';

describe('preload.helpers', () => {
	describe('createElectronAPI', () => {
		const mockIpcRenderer = {
			invoke: jest.fn(),
			on: jest.fn(),
			removeAllListeners: jest.fn()
		};

		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should create complete ElectronAPI object', () => {
			const api = createElectronAPI(mockIpcRenderer);

			expect(api).toHaveProperty('sendMessage');
			expect(api).toHaveProperty('getVersion');
			expect(api).toHaveProperty('getPlatform');
			expect(api).toHaveProperty('openExternal');
			expect(api).toHaveProperty('minimizeWindow');
			expect(api).toHaveProperty('maximizeWindow');
			expect(api).toHaveProperty('closeWindow');
			expect(api).toHaveProperty('isMaximized');
			expect(api).toHaveProperty('onMaximize');
			expect(api).toHaveProperty('onUnmaximize');
			expect(api).toHaveProperty('removeAllListeners');
			expect(api).toHaveProperty('openLicenseWindow');
			expect(api).toHaveProperty('closeLicenseWindow');
			expect(api).toHaveProperty('getMainAppLocale');
		});

		it('should call ipcRenderer.invoke for sendMessage', () => {
			const api = createElectronAPI(mockIpcRenderer);
			api.sendMessage('test message');

			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('send-message', 'test message');
		});

		it('should call ipcRenderer.invoke for getVersion', () => {
			const api = createElectronAPI(mockIpcRenderer);
			api.getVersion();

			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-version');
		});

		it('should return process.platform for getPlatform', () => {
			const api = createElectronAPI(mockIpcRenderer);
			const result = api.getPlatform();

			expect(result).toBe(process.platform);
		});

		it('should call ipcRenderer.invoke for openExternal', () => {
			const api = createElectronAPI(mockIpcRenderer);
			api.openExternal('https://example.com');

			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('open-external', 'https://example.com');
		});

		it('should call ipcRenderer.invoke for window controls', () => {
			const api = createElectronAPI(mockIpcRenderer);

			api.minimizeWindow();
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('window-minimize');

			api.maximizeWindow();
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('window-maximize');

			api.closeWindow();
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('window-close');

			api.isMaximized();
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('window-is-maximized');
		});

		it('should call ipcRenderer.on for event listeners', () => {
			const api = createElectronAPI(mockIpcRenderer);
			const mockCallback = jest.fn();

			api.onMaximize(mockCallback);
			expect(mockIpcRenderer.on).toHaveBeenCalledWith('window-maximized', mockCallback);

			api.onUnmaximize(mockCallback);
			expect(mockIpcRenderer.on).toHaveBeenCalledWith('window-unmaximized', mockCallback);
		});

		it('should call ipcRenderer.removeAllListeners', () => {
			const api = createElectronAPI(mockIpcRenderer);

			api.removeAllListeners('test-channel');
			expect(mockIpcRenderer.removeAllListeners).toHaveBeenCalledWith('test-channel');
		});

		it('should call ipcRenderer.invoke for license window controls', () => {
			const api = createElectronAPI(mockIpcRenderer);

			api.openLicenseWindow();
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('open-license-window');

			api.closeLicenseWindow();
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('close-license-window');

			api.getMainAppLocale();
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-main-app-locale');
		});
	});

	describe('createNodeAPI', () => {
		it('should create NodeAPI object with provided env', () => {
			const api = createNodeAPI('development');

			expect(api).toEqual({ env: 'development' });
		});

		it('should handle undefined env', () => {
			const api = createNodeAPI(undefined);

			expect(api).toEqual({ env: undefined });
		});

		it('should create object with production env', () => {
			const api = createNodeAPI('production');

			expect(api).toEqual({ env: 'production' });
		});
	});

	describe('getPlatform', () => {
		it('should return process.platform', () => {
			const result = getPlatform();
			expect(result).toBe(process.platform);
		});

		it('should return a string', () => {
			const result = getPlatform();
			expect(typeof result).toBe('string');
		});
	});
});