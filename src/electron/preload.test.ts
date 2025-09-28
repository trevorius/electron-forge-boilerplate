import { jest } from '@jest/globals';

// Mock electron modules
const mockContextBridge = {
	exposeInMainWorld: jest.fn()
};

const mockIpcRenderer = {
	invoke: jest.fn(),
	on: jest.fn(),
	removeAllListeners: jest.fn()
};

jest.mock('electron', () => ({
	contextBridge: mockContextBridge,
	ipcRenderer: mockIpcRenderer
}));

describe('preload.ts', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Set NODE_ENV for testing
		process.env.NODE_ENV = 'test';
	});

	afterEach(() => {
		jest.resetModules();
	});

	it('should expose electronAPI to main world', async () => {
		// Import preload to trigger execution
		await import('./preload');

		expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith('electronAPI', expect.objectContaining({
			sendMessage: expect.any(Function),
			getVersion: expect.any(Function),
			getPlatform: expect.any(Function),
			openExternal: expect.any(Function),
			minimizeWindow: expect.any(Function),
			maximizeWindow: expect.any(Function),
			closeWindow: expect.any(Function),
			isMaximized: expect.any(Function),
			onMaximize: expect.any(Function),
			onUnmaximize: expect.any(Function),
			removeAllListeners: expect.any(Function),
			openLicenseWindow: expect.any(Function),
			closeLicenseWindow: expect.any(Function),
			getMainAppLocale: expect.any(Function)
		}));
	});

	it('should expose nodeAPI to main world', async () => {
		// Import preload to trigger execution
		await import('./preload');

		expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith('nodeAPI', expect.objectContaining({
			env: expect.any(String)
		}));
	});

	it('should call exposeInMainWorld twice', async () => {
		// Import preload to trigger execution
		await import('./preload');

		expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledTimes(2);
	});

	it('should expose APIs with correct keys', async () => {
		// Import preload to trigger execution
		await import('./preload');

		const exposedKeys = mockContextBridge.exposeInMainWorld.mock.calls.map(call => call[0]);
		expect(exposedKeys).toContain('electronAPI');
		expect(exposedKeys).toContain('nodeAPI');
	});

	it('should work with different NODE_ENV values', async () => {
		// Test with development environment
		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = 'development';

		// Reset modules to get fresh import
		jest.resetModules();

		await import('./preload');

		expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith('nodeAPI', expect.objectContaining({
			env: 'development'
		}));

		// Restore original NODE_ENV
		process.env.NODE_ENV = originalEnv;
	});

	it('should properly type the exposed APIs', async () => {
		// Import preload to trigger execution
		await import('./preload');

		// Verify that the electronAPI is exposed with correct structure
		const electronAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
			call => call[0] === 'electronAPI'
		);

		expect(electronAPICall).toBeDefined();
		expect(electronAPICall![1]).toMatchObject({
			sendMessage: expect.any(Function),
			getVersion: expect.any(Function),
			getPlatform: expect.any(Function),
			openExternal: expect.any(Function),
			minimizeWindow: expect.any(Function),
			maximizeWindow: expect.any(Function),
			closeWindow: expect.any(Function),
			isMaximized: expect.any(Function),
			onMaximize: expect.any(Function),
			onUnmaximize: expect.any(Function),
			removeAllListeners: expect.any(Function),
			openLicenseWindow: expect.any(Function),
			closeLicenseWindow: expect.any(Function),
			getMainAppLocale: expect.any(Function)
		});

		// Verify that the nodeAPI is exposed with correct structure
		const nodeAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
			call => call[0] === 'nodeAPI'
		);

		expect(nodeAPICall).toBeDefined();
		expect(nodeAPICall![1]).toHaveProperty('env');
	});

	describe('electronAPI functions', () => {
		let electronAPI: any;

		beforeEach(async () => {
			// Import preload to trigger execution
			await import('./preload');

			// Get the electronAPI from the mock call
			const electronAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
				call => call[0] === 'electronAPI'
			);
			electronAPI = electronAPICall![1];
		});

		it('should call sendMessage with correct parameters', async () => {
			await electronAPI.sendMessage('test message');
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('send-message', 'test message');
		});

		it('should call getVersion with correct parameters', async () => {
			await electronAPI.getVersion();
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-version');
		});

		it('should return platform from process.platform', () => {
			const originalPlatform = process.platform;
			Object.defineProperty(process, 'platform', { value: 'linux' });

			const result = electronAPI.getPlatform();
			expect(result).toBe('linux');

			Object.defineProperty(process, 'platform', { value: originalPlatform });
		});

		it('should call openExternal with correct parameters', async () => {
			await electronAPI.openExternal('https://example.com');
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('open-external', 'https://example.com');
		});

		it('should call minimizeWindow with correct parameters', async () => {
			await electronAPI.minimizeWindow();
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('window-minimize');
		});

		it('should call maximizeWindow with correct parameters', async () => {
			await electronAPI.maximizeWindow();
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('window-maximize');
		});

		it('should call closeWindow with correct parameters', async () => {
			await electronAPI.closeWindow();
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('window-close');
		});

		it('should call isMaximized with correct parameters', async () => {
			await electronAPI.isMaximized();
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('window-is-maximized');
		});

		it('should register onMaximize callback', () => {
			const callback = jest.fn();
			electronAPI.onMaximize(callback);
			expect(mockIpcRenderer.on).toHaveBeenCalledWith('window-maximized', callback);
		});

		it('should register onUnmaximize callback', () => {
			const callback = jest.fn();
			electronAPI.onUnmaximize(callback);
			expect(mockIpcRenderer.on).toHaveBeenCalledWith('window-unmaximized', callback);
		});

		it('should remove all listeners for channel', () => {
			electronAPI.removeAllListeners('test-channel');
			expect(mockIpcRenderer.removeAllListeners).toHaveBeenCalledWith('test-channel');
		});

		it('should call openLicenseWindow with correct parameters', async () => {
			await electronAPI.openLicenseWindow();
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('open-license-window');
		});

		it('should call closeLicenseWindow with correct parameters', async () => {
			await electronAPI.closeLicenseWindow();
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('close-license-window');
		});

		it('should call getMainAppLocale with correct parameters', async () => {
			await electronAPI.getMainAppLocale();
			expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-main-app-locale');
		});
	});

	describe('nodeAPI', () => {
		it('should expose NODE_ENV from process.env', async () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'test-environment';

			// Reset modules to get fresh import
			jest.resetModules();
			await import('./preload');

			const nodeAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
				call => call[0] === 'nodeAPI'
			);

			expect(nodeAPICall![1]).toEqual({
				env: 'test-environment'
			});

			process.env.NODE_ENV = originalEnv;
		});

		it('should handle undefined NODE_ENV', async () => {
			const originalEnv = process.env.NODE_ENV;
			delete process.env.NODE_ENV;

			// Reset modules to get fresh import
			jest.resetModules();
			await import('./preload');

			const nodeAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
				call => call[0] === 'nodeAPI'
			);

			expect(nodeAPICall![1]).toEqual({
				env: undefined
			});

			process.env.NODE_ENV = originalEnv;
		});
	});
});