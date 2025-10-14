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

	it('should expose LLM API functions', async () => {
		// Import preload to trigger execution
		await import('./preload');

		// Get the exposed electronAPI
		const electronAPICall = mockContextBridge.exposeInMainWorld.mock.calls.find(
			call => call[0] === 'electronAPI'
		);
		const electronAPI = electronAPICall![1];

		// Verify LLM API functions are present
		expect(electronAPI.llmListAvailable).toBeDefined();
		expect(electronAPI.llmListInstalled).toBeDefined();
		expect(electronAPI.llmSelectFromDisk).toBeDefined();
		expect(electronAPI.llmLoadModel).toBeDefined();
		expect(electronAPI.llmUnloadModel).toBeDefined();
		expect(electronAPI.llmIsLoaded).toBeDefined();
		expect(electronAPI.llmGetCurrentModel).toBeDefined();
		expect(electronAPI.llmDownloadModel).toBeDefined();
		expect(electronAPI.llmDeleteModel).toBeDefined();
		expect(electronAPI.llmUpdateConfig).toBeDefined();
		expect(electronAPI.llmGetConfig).toBeDefined();
		expect(electronAPI.llmGenerateResponse).toBeDefined();
		expect(electronAPI.llmOnDownloadProgress).toBeDefined();
		expect(electronAPI.llmOnToken).toBeDefined();
		expect(electronAPI.llmGetModelsDirectory).toBeDefined();
		expect(electronAPI.llmSetModelsDirectory).toBeDefined();
		expect(electronAPI.llmScanFolder).toBeDefined();

		// Actually call one to execute the arrow function
		mockIpcRenderer.invoke.mockResolvedValue([]);
		await electronAPI.llmListAvailable();
		expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-list-available');

		await electronAPI.llmListInstalled();
		expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-list-installed');

		await electronAPI.llmSelectFromDisk();
		expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-select-from-disk');

		await electronAPI.llmLoadModel('/test/path');
		expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-load-model', '/test/path', undefined);

		await electronAPI.llmUnloadModel();
		expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-unload-model');

		await electronAPI.llmIsLoaded();
		expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-is-loaded');

		await electronAPI.llmGetCurrentModel();
		expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-get-current-model');

		await electronAPI.llmDownloadModel({ id: 'test', name: 'Test', filename: 'test.gguf', url: 'http://test.com', size: 100 });
		expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-download-model', expect.any(Object));

		await electronAPI.llmDeleteModel({ id: 'test', name: 'Test', filename: 'test.gguf', url: 'http://test.com', size: 100 });
		expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-delete-model', expect.any(Object));

		await electronAPI.llmUpdateConfig({ temperature: 0.7 });
		expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-update-config', expect.any(Object));

		await electronAPI.llmGetConfig();
		expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-get-config');

		await electronAPI.llmGenerateResponse('test prompt');
		expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-generate-response', 'test prompt');

		// Test event listeners
		const progressCallback = jest.fn();
		const unsubProgress = electronAPI.llmOnDownloadProgress(progressCallback);
		expect(mockIpcRenderer.on).toHaveBeenCalledWith('llm-download-progress', expect.any(Function));

		// Get the listener function and call it to test the inner arrow function
		const progressListenerCall = (mockIpcRenderer.on as jest.Mock).mock.calls.find(
			call => call[0] === 'llm-download-progress'
		);
		if (progressListenerCall) {
			const listener = progressListenerCall[1];
			listener(null, { modelId: 'test', progress: 50 });
			expect(progressCallback).toHaveBeenCalledWith({ modelId: 'test', progress: 50 });
		}

		unsubProgress();
		expect(mockIpcRenderer.removeListener).toHaveBeenCalled();

		const tokenCallback = jest.fn();
		const unsubToken = electronAPI.llmOnToken(tokenCallback);
		expect(mockIpcRenderer.on).toHaveBeenCalledWith('llm-token', expect.any(Function));

		// Get the listener function and call it to test the inner arrow function
		const tokenListenerCall = (mockIpcRenderer.on as jest.Mock).mock.calls.find(
			call => call[0] === 'llm-token'
		);
		if (tokenListenerCall) {
			const listener = tokenListenerCall[1];
			listener(null, 'test token');
			expect(tokenCallback).toHaveBeenCalledWith('test token');
		}

		unsubToken();
		expect(mockIpcRenderer.removeListener).toHaveBeenCalled();

		await electronAPI.llmGetModelsDirectory();
		expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-get-models-directory');

		await electronAPI.llmSetModelsDirectory();
		expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-set-models-directory');

		await electronAPI.llmScanFolder('/test/path');
		expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('llm-scan-folder', '/test/path');
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
					const scoreData = { name: 'Player', score: 1000, game: 'lineDestroyer' };
					await electronAPI.saveScore(scoreData);
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('save-score', scoreData);
				}
			});

			it('should test getHighScores if available', async () => {
				if ('getHighScores' in electronAPI) {
					await electronAPI.getHighScores('lineDestroyer', 10);
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-high-scores', 'lineDestroyer', 10);
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
					await electronAPI.isHighScore('lineDestroyer', 1500);
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('is-high-score', 'lineDestroyer', 1500);
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
					await electronAPI.clearScores('lineDestroyer');
					expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('clear-scores', 'lineDestroyer');
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

					// Get the listener function that was registered
					const listenerCall = (mockIpcRenderer.on as jest.Mock).mock.calls.find(
						call => call[0] === 'chat-message-stream'
					);
					if (listenerCall) {
						const listener = listenerCall[1];
						// Call the listener to test the callback wrapper
						listener(null, { chatId: 1, messageId: 1, content: 'test', done: false });
						expect(callback).toHaveBeenCalledWith({ chatId: 1, messageId: 1, content: 'test', done: false });
					}

					// Test cleanup function
					if (typeof removeListener === 'function') {
						removeListener();
						expect(mockIpcRenderer.removeListener).toHaveBeenCalledWith('chat-message-stream', expect.any(Function));
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