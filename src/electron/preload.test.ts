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

// Mock helper functions
const mockElectronAPI = {
	sendMessage: jest.fn(),
	getVersion: jest.fn(),
	getPlatform: jest.fn(),
	openExternal: jest.fn(),
	minimizeWindow: jest.fn(),
	maximizeWindow: jest.fn(),
	closeWindow: jest.fn(),
	isMaximized: jest.fn(),
	onMaximize: jest.fn(),
	onUnmaximize: jest.fn(),
	removeAllListeners: jest.fn(),
	openLicenseWindow: jest.fn(),
	closeLicenseWindow: jest.fn(),
	getMainAppLocale: jest.fn()
};

const mockNodeAPI = {
	env: 'test'
};

jest.mock('./preload.helpers', () => ({
	createElectronAPI: jest.fn(() => mockElectronAPI),
	createNodeAPI: jest.fn(() => mockNodeAPI),
	ElectronAPI: {},
	NodeAPI: {}
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

	it('should create electronAPI using createElectronAPI helper', async () => {
		const { createElectronAPI } = await import('./preload.helpers');

		// Import preload to trigger execution
		await import('./preload');

		expect(createElectronAPI).toHaveBeenCalledWith(mockIpcRenderer);
	});

	it('should create nodeAPI using createNodeAPI helper', async () => {
		const { createNodeAPI } = await import('./preload.helpers');

		// Import preload to trigger execution
		await import('./preload');

		expect(createNodeAPI).toHaveBeenCalledWith('test');
	});

	it('should expose electronAPI to main world', async () => {
		// Import preload to trigger execution
		await import('./preload');

		expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith('electronAPI', mockElectronAPI);
	});

	it('should expose nodeAPI to main world', async () => {
		// Import preload to trigger execution
		await import('./preload');

		expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith('nodeAPI', mockNodeAPI);
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
		process.env.NODE_ENV = 'development';

		// Reset modules to get fresh import
		jest.resetModules();

		// Re-mock after reset
		jest.doMock('electron', () => ({
			contextBridge: mockContextBridge,
			ipcRenderer: mockIpcRenderer
		}));

		jest.doMock('./preload.helpers', () => ({
			createElectronAPI: jest.fn(() => mockElectronAPI),
			createNodeAPI: jest.fn(() => ({ env: 'development' })),
			ElectronAPI: {},
			NodeAPI: {}
		}));

		const { createNodeAPI } = await import('./preload.helpers');
		await import('./preload');

		expect(createNodeAPI).toHaveBeenCalledWith('development');
	});

	it('should work with production environment', async () => {
		// Test with production environment
		process.env.NODE_ENV = 'production';

		// Reset modules to get fresh import
		jest.resetModules();

		// Re-mock after reset
		jest.doMock('electron', () => ({
			contextBridge: mockContextBridge,
			ipcRenderer: mockIpcRenderer
		}));

		jest.doMock('./preload.helpers', () => ({
			createElectronAPI: jest.fn(() => mockElectronAPI),
			createNodeAPI: jest.fn(() => ({ env: 'production' })),
			ElectronAPI: {},
			NodeAPI: {}
		}));

		const { createNodeAPI } = await import('./preload.helpers');
		await import('./preload');

		expect(createNodeAPI).toHaveBeenCalledWith('production');
	});

	it('should handle undefined NODE_ENV', async () => {
		// Test with undefined NODE_ENV
		delete process.env.NODE_ENV;

		// Reset modules to get fresh import
		jest.resetModules();

		// Re-mock after reset
		jest.doMock('electron', () => ({
			contextBridge: mockContextBridge,
			ipcRenderer: mockIpcRenderer
		}));

		jest.doMock('./preload.helpers', () => ({
			createElectronAPI: jest.fn(() => mockElectronAPI),
			createNodeAPI: jest.fn(() => ({ env: undefined })),
			ElectronAPI: {},
			NodeAPI: {}
		}));

		const { createNodeAPI } = await import('./preload.helpers');
		await import('./preload');

		expect(createNodeAPI).toHaveBeenCalledWith(undefined);
	});

	it('should properly type the exposed APIs', async () => {
		// Import preload to trigger execution
		await import('./preload');

		// Verify that the electronAPI is exposed with correct structure
		const electronAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
			call => call[0] === 'electronAPI'
		);

		expect(electronAPICall).toBeDefined();
		expect(electronAPICall![1]).toBe(mockElectronAPI);

		// Verify that the nodeAPI is exposed with correct structure
		const nodeAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
			call => call[0] === 'nodeAPI'
		);

		expect(nodeAPICall).toBeDefined();
		// Check that it has the env property, regardless of its value
		expect(nodeAPICall![1]).toHaveProperty('env');
	});

	it('should ensure APIs satisfy their interfaces', async () => {
		// Import preload to trigger execution
		await import('./preload');

		// The fact that the code compiles and runs without TypeScript errors
		// means the APIs satisfy their respective interfaces (ElectronAPI and NodeAPI)
		// This test validates that the satisfies keyword works correctly

		expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
			'electronAPI',
			expect.objectContaining({
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
			})
		);

		expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
			'nodeAPI',
			expect.any(Object)
		);
	});
});