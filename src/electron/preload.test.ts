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
});