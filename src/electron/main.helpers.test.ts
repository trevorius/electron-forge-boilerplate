import {
  ScreenInfo,
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
  shouldExecuteJavaScript,
  shouldFocusExistingWindow,
  shouldOpenDevTools,
  shouldQuitApp,
  shouldReturnMainWindowStatus,
  shouldSendWindowEvent,
  shouldSetupMacOSMenu,
  shouldShowWindow,
  valueOrUndefined
} from './main.helpers';

describe('main.helpers', () => {

  describe('valueOrUndefined', () => {
    it('should return undefined when value is undefined', () => {
      expect(valueOrUndefined(undefined)).toBe(undefined);
    });

    it('should return value when value is not undefined', () => {
      expect(valueOrUndefined(1)).toBe(1);
    });
  });

	describe('calculateOptimalWindowSize', () => {
		it('should return dimensions within screen bounds with default max values', () => {
			const screenInfo: ScreenInfo = { width: 1920, height: 1080 };
			const result = calculateOptimalWindowSize(screenInfo);

			expect(result.width).toBe(1820); // 1920 - 100
			expect(result.height).toBe(980); // 1080 - 100
		});

		it('should respect max width and height limits', () => {
			const screenInfo: ScreenInfo = { width: 3000, height: 2000 };
			const result = calculateOptimalWindowSize(screenInfo);

			expect(result.width).toBe(2300); // maxWidth limit
			expect(result.height).toBe(1200); // maxHeight limit
		});

		it('should work with custom max values', () => {
			const screenInfo: ScreenInfo = { width: 1600, height: 900 };
			const result = calculateOptimalWindowSize(screenInfo, 1400, 800);

			expect(result.width).toBe(1400);
			expect(result.height).toBe(800);
		});

		it('should handle small screens properly', () => {
			const screenInfo: ScreenInfo = { width: 800, height: 600 };
			const result = calculateOptimalWindowSize(screenInfo);

			expect(result.width).toBe(700); // 800 - 100
			expect(result.height).toBe(500); // 600 - 100
		});
	});

	describe('calculateLicenseWindowSize', () => {
		it('should calculate 75% of main window size by default', () => {
			const mainWindowDimensions: WindowDimensions = { width: 1000, height: 800 };
			const result = calculateLicenseWindowSize(mainWindowDimensions);

			expect(result.width).toBe(750);
			expect(result.height).toBe(600);
		});

		it('should work with custom scale factor', () => {
			const mainWindowDimensions: WindowDimensions = { width: 1000, height: 800 };
			const result = calculateLicenseWindowSize(mainWindowDimensions, 0.5);

			expect(result.width).toBe(500);
			expect(result.height).toBe(400);
		});

		it('should handle fractional results', () => {
			const mainWindowDimensions: WindowDimensions = { width: 1001, height: 801 };
			const result = calculateLicenseWindowSize(mainWindowDimensions);

			expect(result.width).toBe(750.75);
			expect(result.height).toBe(600.75);
		});
	});

	describe('buildStartUrl', () => {
		it('should return dev URL when in development', () => {
			const result = buildStartUrl(true, false, '/some/path');
			expect(result).toBe('http://localhost:5173');
		});

		it('should return packaged file URL when in production and packaged', () => {
			const result = buildStartUrl(false, true, '/app/resources');
			expect(result).toBe('file:///app/resources/dist-react/index.html');
		});

		it('should return unpackaged file URL when in production but not packaged', () => {
			const result = buildStartUrl(false, false, '/app/dist-electron');
			expect(result).toBe('file:///app/dist-electron/../dist-react/index.html');
		});
	});

	describe('buildLicenseUrl', () => {
		it('should return dev license URL when in development', () => {
			const result = buildLicenseUrl(true, false, '/some/path');
			expect(result).toBe('http://localhost:5173/license.html');
		});

		it('should return packaged license file URL when in production and packaged', () => {
			const result = buildLicenseUrl(false, true, '/app/resources');
			expect(result).toBe('file:///app/resources/dist-react/license.html');
		});

		it('should return unpackaged license file URL when in production but not packaged', () => {
			const result = buildLicenseUrl(false, false, '/app/dist-electron');
			expect(result).toBe('file:///app/dist-electron/../dist-react/license.html');
		});
	});

	describe('buildMacOSMenu', () => {
		it('should build a complete macOS menu structure', () => {
			const appName = 'TestApp';
			const result = buildMacOSMenu(appName);

			expect(result).toHaveLength(4);
			expect(result[0].label).toBe(appName);
			expect(result[1].label).toBe('Edit');
			expect(result[2].label).toBe('View');
			expect(result[3].label).toBe('Window');
		});

		it('should include correct app menu items', () => {
			const result = buildMacOSMenu('TestApp');
			const appMenu = result[0];

			expect(Array.isArray(appMenu.submenu)).toBe(true);
			const submenu = appMenu.submenu as any[];

			expect(submenu.some(item => item.role === 'about')).toBe(true);
			expect(submenu.some(item => item.role === 'quit')).toBe(true);
			expect(submenu.some(item => item.role === 'hide')).toBe(true);
			expect(submenu.some(item => item.role === 'hideOthers')).toBe(true);
		});

		it('should include correct edit menu items', () => {
			const result = buildMacOSMenu('TestApp');
			const editMenu = result[1];

			expect(Array.isArray(editMenu.submenu)).toBe(true);
			const submenu = editMenu.submenu as any[];

			expect(submenu.some(item => item.role === 'undo')).toBe(true);
			expect(submenu.some(item => item.role === 'redo')).toBe(true);
			expect(submenu.some(item => item.role === 'cut')).toBe(true);
			expect(submenu.some(item => item.role === 'copy')).toBe(true);
			expect(submenu.some(item => item.role === 'paste')).toBe(true);
			expect(submenu.some(item => item.role === 'selectAll')).toBe(true);
		});

		it('should include correct view menu items', () => {
			const result = buildMacOSMenu('TestApp');
			const viewMenu = result[2];

			expect(Array.isArray(viewMenu.submenu)).toBe(true);
			const submenu = viewMenu.submenu as any[];

			expect(submenu.some(item => item.role === 'reload')).toBe(true);
			expect(submenu.some(item => item.role === 'toggleDevTools')).toBe(true);
			expect(submenu.some(item => item.role === 'togglefullscreen')).toBe(true);
		});

		it('should include correct window menu items', () => {
			const result = buildMacOSMenu('TestApp');
			const windowMenu = result[3];

			expect(Array.isArray(windowMenu.submenu)).toBe(true);
			const submenu = windowMenu.submenu as any[];

			expect(submenu.some(item => item.role === 'minimize')).toBe(true);
			expect(submenu.some(item => item.role === 'close')).toBe(true);
		});
	});

	describe('shouldOpenDevTools', () => {
		it('should return true in development', () => {
			expect(shouldOpenDevTools(true)).toBe(true);
		});

		it('should return false in production', () => {
			expect(shouldOpenDevTools(false)).toBe(false);
		});
	});

	describe('shouldShowWindow', () => {
		it('should return true for valid window', () => {
			const mockWindow = { show: jest.fn() };
			expect(shouldShowWindow(mockWindow)).toBe(true);
		});

		it('should return false for null window', () => {
			expect(shouldShowWindow(null)).toBe(false);
		});

		it('should return false for undefined window', () => {
			expect(shouldShowWindow(undefined)).toBe(false);
		});
	});

	describe('shouldSendWindowEvent', () => {
		it('should return true for valid window', () => {
			const mockWindow = { webContents: { send: jest.fn() } };
			expect(shouldSendWindowEvent(mockWindow)).toBe(true);
		});

		it('should return false for null window', () => {
			expect(shouldSendWindowEvent(null)).toBe(false);
		});

		it('should return false for undefined window', () => {
			expect(shouldSendWindowEvent(undefined)).toBe(false);
		});
	});

	describe('shouldQuitApp', () => {
		it('should return true for non-macOS platforms', () => {
			expect(shouldQuitApp('linux')).toBe(true);
			expect(shouldQuitApp('win32')).toBe(true);
		});

		it('should return false for macOS', () => {
			expect(shouldQuitApp('darwin')).toBe(false);
		});
	});

	describe('shouldSetupMacOSMenu', () => {
		it('should return true for macOS', () => {
			expect(shouldSetupMacOSMenu('darwin')).toBe(true);
		});

		it('should return false for non-macOS platforms', () => {
			expect(shouldSetupMacOSMenu('linux')).toBe(false);
			expect(shouldSetupMacOSMenu('win32')).toBe(false);
		});
	});

	describe('shouldCreateNewWindow', () => {
		it('should return true when no windows exist', () => {
			expect(shouldCreateNewWindow(0)).toBe(true);
		});

		it('should return false when windows exist', () => {
			expect(shouldCreateNewWindow(1)).toBe(false);
			expect(shouldCreateNewWindow(5)).toBe(false);
		});
	});

	describe('shouldFocusExistingWindow', () => {
		it('should return true for valid window', () => {
			const mockWindow = { focus: jest.fn() };
			expect(shouldFocusExistingWindow(mockWindow)).toBe(true);
		});

		it('should return false for null window', () => {
			expect(shouldFocusExistingWindow(null)).toBe(false);
		});

		it('should return false for undefined window', () => {
			expect(shouldFocusExistingWindow(undefined)).toBe(false);
		});
	});

	describe('shouldReturnMainWindowStatus', () => {
		it('should return true for valid window', () => {
			const mockWindow = { isMaximized: jest.fn() };
			expect(shouldReturnMainWindowStatus(mockWindow)).toBe(true);
		});

		it('should return false for null window', () => {
			expect(shouldReturnMainWindowStatus(null)).toBe(false);
		});

		it('should return false for undefined window', () => {
			expect(shouldReturnMainWindowStatus(undefined)).toBe(false);
		});
	});

	describe('shouldExecuteJavaScript', () => {
		it('should return true for valid window with webContents', () => {
			const mockWindow = {
				webContents: {
					executeJavaScript: jest.fn()
				}
			};
			expect(shouldExecuteJavaScript(mockWindow)).toBe(true);
		});

		it('should return false for null window', () => {
			expect(shouldExecuteJavaScript(null)).toBe(false);
		});

		it('should return false for undefined window', () => {
			expect(shouldExecuteJavaScript(undefined)).toBe(false);
		});

		it('should return false for window without webContents', () => {
			const mockWindow = { webContents: null };
			expect(shouldExecuteJavaScript(mockWindow)).toBe(false);
		});
	});

	describe('shouldCloseWindow', () => {
		it('should return true for valid window', () => {
			const mockWindow = { close: jest.fn() };
			expect(shouldCloseWindow(mockWindow)).toBe(true);
		});

		it('should return false for null window', () => {
			expect(shouldCloseWindow(null)).toBe(false);
		});

		it('should return false for undefined window', () => {
			expect(shouldCloseWindow(undefined)).toBe(false);
		});
	});

	describe('getBasePath', () => {
		it('should return resourcesPath when packaged', () => {
			const result = getBasePath(true, '/app/resources', '/app/src');
			expect(result).toBe('/app/resources');
		});

		it('should return dirname when not packaged', () => {
			const result = getBasePath(false, '/app/resources', '/app/src');
			expect(result).toBe('/app/src');
		});
	});

	describe('handleWindowAction', () => {
		it('should execute action when window is valid', () => {
			const mockWindow = { webContents: { send: jest.fn() } };
			const mockAction = jest.fn();

			handleWindowAction(mockWindow, mockAction);

			expect(mockAction).toHaveBeenCalled();
		});

		it('should not execute action when window is null', () => {
			const mockAction = jest.fn();

			handleWindowAction(null, mockAction);

			expect(mockAction).not.toHaveBeenCalled();
		});

		it('should not execute action when window is undefined', () => {
			const mockAction = jest.fn();

			handleWindowAction(undefined, mockAction);

			expect(mockAction).not.toHaveBeenCalled();
		});
	});

	describe('handleWindowShow', () => {
		it('should show window and open dev tools in development', () => {
			const mockWindow = {
				show: jest.fn(),
				webContents: {
					openDevTools: jest.fn()
				}
			};

			handleWindowShow(mockWindow, true);

			expect(mockWindow.show).toHaveBeenCalled();
			expect(mockWindow.webContents.openDevTools).toHaveBeenCalled();
		});

		it('should show window but not open dev tools in production', () => {
			const mockWindow = {
				show: jest.fn(),
				webContents: {
					openDevTools: jest.fn()
				}
			};

			handleWindowShow(mockWindow, false);

			expect(mockWindow.show).toHaveBeenCalled();
			expect(mockWindow.webContents.openDevTools).not.toHaveBeenCalled();
		});

		it('should not show window when window is null', () => {
			const mockWindow = null;

			handleWindowShow(mockWindow, true);

			// No error should be thrown, function should handle null gracefully
			expect(true).toBe(true);
		});
	});

	describe('handleWindowMaximizeToggle', () => {
		it('should unmaximize when window is maximized', () => {
			const mockWindow = {
				isMaximized: jest.fn(() => true),
				unmaximize: jest.fn(),
				maximize: jest.fn()
			};

			handleWindowMaximizeToggle(mockWindow);

			expect(mockWindow.unmaximize).toHaveBeenCalled();
			expect(mockWindow.maximize).not.toHaveBeenCalled();
		});

		it('should maximize when window is not maximized', () => {
			const mockWindow = {
				isMaximized: jest.fn(() => false),
				unmaximize: jest.fn(),
				maximize: jest.fn()
			};

			handleWindowMaximizeToggle(mockWindow);

			expect(mockWindow.maximize).toHaveBeenCalled();
			expect(mockWindow.unmaximize).not.toHaveBeenCalled();
		});

		it('should not perform action when window is null', () => {
			handleWindowMaximizeToggle(null);

			// No error should be thrown, function should handle null gracefully
			expect(true).toBe(true);
		});
	});

	describe('getLocaleOrDefault', () => {
		it('should return locale from localStorage', async () => {
			const mockWindow = {
				webContents: {
					executeJavaScript: jest.fn(() => Promise.resolve('fr'))
				}
			};

			const result = await getLocaleOrDefault(mockWindow);

			expect(result).toBe('fr');
			expect(mockWindow.webContents.executeJavaScript).toHaveBeenCalledWith('localStorage.getItem("i18nextLng")');
		});

		it('should return default locale when localStorage returns null', async () => {
			const mockWindow = {
				webContents: {
					executeJavaScript: jest.fn(() => Promise.resolve(null))
				}
			};

			const result = await getLocaleOrDefault(mockWindow);

			expect(result).toBe('en');
		});

		it('should return default locale when localStorage throws error', async () => {
			const mockWindow = {
				webContents: {
					executeJavaScript: jest.fn(() => Promise.reject(new Error('Test error')))
				}
			};

			const result = await getLocaleOrDefault(mockWindow);

			expect(result).toBe('en');
		});

		it('should return default locale when window is null', async () => {
			const result = await getLocaleOrDefault(null);

			expect(result).toBe('en');
		});

		it('should return default locale when window has no webContents', async () => {
			const mockWindow = {
				webContents: null
			};

			const result = await getLocaleOrDefault(mockWindow);

			expect(result).toBe('en');
		});
	});
});
