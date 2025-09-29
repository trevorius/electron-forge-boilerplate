import { jest } from '@jest/globals';

// Mock electron modules
const mockContextBridge = {
	exposeInMainWorld: jest.fn()
};

const mockIpcRenderer = {
	invoke: jest.fn(),
	on: jest.fn(),
	removeAllListeners: jest.fn(),
	removeListener: jest.fn()
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

		// Base API functions that should always be present
		const expectedBaseAPI = {
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
		};

		expect(mockContextBridge.exposeInMainWorld).toHaveBeenCalledWith('electronAPI', expect.objectContaining(expectedBaseAPI));

		// Get the actual electronAPI that was exposed
		const electronAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
			call => call[0] === 'electronAPI'
		);
		const exposedAPI = electronAPICall![1];

		// Check that it includes all base functions
		expect(exposedAPI).toMatchObject(expectedBaseAPI);

		// Verify it's an object with functions (dynamic API modules will be spread in)
		expect(typeof exposedAPI).toBe('object');
		expect(exposedAPI).not.toBeNull();
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

		// Base API functions that should always be present
		const expectedBaseAPI = {
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
		};

		expect(electronAPICall![1]).toMatchObject(expectedBaseAPI);

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

		// Base API function tests
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

		// Dynamic API tests - test any additional APIs that were included from modules
		it('should test all available API functions', () => {
			// Get all function properties from the electronAPI
			const apiFunctions = Object.keys(electronAPI).filter(key =>
				typeof electronAPI[key] === 'function'
			);

			// Ensure we have all the base functions plus any from modules
			expect(apiFunctions.length).toBeGreaterThanOrEqual(14); // 14 base functions minimum

			// Test that all functions are callable (basic smoke test)
			apiFunctions.forEach(funcName => {
				expect(typeof electronAPI[funcName]).toBe('function');
			});
		});

		// Test specific API functions if they exist (dynamic testing based on what's actually available)
		describe('conditional API tests', () => {
			it('should test saveScore if available', async () => {
				if ('saveScore' in electronAPI) {
					const scoreData = { name: 'Player', score: 1000, game: 'tetris' };
					await electronAPI.saveScore(scoreData);
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('save-score', scoreData);
				}
			});

			it('should test getHighScores if available', async () => {
				if ('getHighScores' in electronAPI) {
					await electronAPI.getHighScores('tetris', 10);
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-high-scores', 'tetris', 10);
				}
			});

			it('should test getAllHighScores if available', async () => {
				if ('getAllHighScores' in electronAPI) {
					await electronAPI.getAllHighScores(20);
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-all-high-scores', 20);
				}
			});

			it('should test isHighScore if available', async () => {
				if ('isHighScore' in electronAPI) {
					await electronAPI.isHighScore('tetris', 1500);
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('is-high-score', 'tetris', 1500);
				}
			});

			it('should test deleteScore if available', async () => {
				if ('deleteScore' in electronAPI) {
					await electronAPI.deleteScore(123);
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('delete-score', 123);
				}
			});

			it('should test clearScores if available', async () => {
				if ('clearScores' in electronAPI) {
					await electronAPI.clearScores('tetris');
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('clear-scores', 'tetris');
				}
			});

			it('should test chatCreate if available', async () => {
				if ('chatCreate' in electronAPI) {
					await electronAPI.chatCreate('Test Chat');
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-create', 'Test Chat');
				}
			});

			it('should test chatGet if available', async () => {
				if ('chatGet' in electronAPI) {
					await electronAPI.chatGet(1);
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-get', 1);
				}
			});

			it('should test chatGetAll if available', async () => {
				if ('chatGetAll' in electronAPI) {
					await electronAPI.chatGetAll();
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-get-all');
				}
			});

			it('should test chatUpdateName if available', async () => {
				if ('chatUpdateName' in electronAPI) {
					await electronAPI.chatUpdateName(1, 'Updated Name');
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-update-name', 1, 'Updated Name');
				}
			});

			it('should test chatDelete if available', async () => {
				if ('chatDelete' in electronAPI) {
					await electronAPI.chatDelete(1);
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-delete', 1);
				}
			});

			it('should test chatSendMessage if available', async () => {
				if ('chatSendMessage' in electronAPI) {
					await electronAPI.chatSendMessage(1, 'Hello');
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-send-message', 1, 'Hello');
				}
			});

			it('should test chatGetMessages if available', async () => {
				if ('chatGetMessages' in electronAPI) {
					await electronAPI.chatGetMessages(1);
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-get-messages', 1);
				}
			});

			it('should test chatGetMessageCount if available', async () => {
				if ('chatGetMessageCount' in electronAPI) {
					await electronAPI.chatGetMessageCount(1);
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('chat-get-message-count', 1);
				}
			});

			it('should test chatOnMessageStream if available', () => {
				if ('chatOnMessageStream' in electronAPI) {
					const callback = jest.fn();
					const removeListener = electronAPI.chatOnMessageStream(callback);

					expect(mockIpcRenderer.on).toHaveBeenCalledWith('chat-message-stream', expect.any(Function));

					// Test cleanup function
					if (typeof removeListener === 'function') {
						removeListener();
					}
				}
			});
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