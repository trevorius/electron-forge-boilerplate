import {
  License,
  LocaleInitResult,
  WindowCloseResult,
  initializeLocale,
  closeLicenseWindow,
  createLicenses,
  getCurrentLicense,
  shouldShowNavigation,
  generateTitle,
  validateLicenseSelection,
  isValidLicenseId,
  getLicenseById,
  formatLocaleError,
  formatCloseError,
  createLoadingState,
  createHeaderClasses,
  createCloseButtonClasses
} from './LicenseApp.helpers';

// Mock the Llama component to avoid markdown issues
jest.mock('./Llama32CommunityLicenseAgreement', () => ({
  Llama32CommunityLicenseAgreement: ({ t }: { t: (key: string) => string }) => <div>Llama License Component</div>
}));

describe('LicenseApp.helpers', () => {
  describe('initializeLocale', () => {
    it('should successfully initialize locale with main app locale', async () => {
      const mockGetMainAppLocale = jest.fn().mockResolvedValue('fr');
      const mockChangeLanguage = jest.fn().mockResolvedValue(undefined);

      const result = await initializeLocale(mockGetMainAppLocale, mockChangeLanguage);

      expect(result).toEqual({
        success: true,
        locale: 'fr'
      });
      expect(mockGetMainAppLocale).toHaveBeenCalledTimes(1);
      expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
    });

    it('should use default locale when main app locale is null', async () => {
      const mockGetMainAppLocale = jest.fn().mockResolvedValue(null);
      const mockChangeLanguage = jest.fn().mockResolvedValue(undefined);

      const result = await initializeLocale(mockGetMainAppLocale, mockChangeLanguage);

      expect(result).toEqual({
        success: true,
        locale: 'en'
      });
      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });

    it('should use default locale when main app locale is empty string', async () => {
      const mockGetMainAppLocale = jest.fn().mockResolvedValue('');
      const mockChangeLanguage = jest.fn().mockResolvedValue(undefined);

      const result = await initializeLocale(mockGetMainAppLocale, mockChangeLanguage);

      expect(result).toEqual({
        success: true,
        locale: 'en'
      });
      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });

    it('should handle getMainAppLocale error and fallback to default', async () => {
      const error = new Error('Failed to get locale');
      const mockGetMainAppLocale = jest.fn().mockRejectedValue(error);
      const mockChangeLanguage = jest.fn().mockResolvedValue(undefined);

      const result = await initializeLocale(mockGetMainAppLocale, mockChangeLanguage);

      expect(result).toEqual({
        success: true,
        locale: 'en',
        error
      });
      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });

    it('should handle both getMainAppLocale and changeLanguage errors', async () => {
      const getLocaleError = new Error('Get locale failed');
      const changeLanguageError = new Error('Change language failed');
      const mockGetMainAppLocale = jest.fn().mockRejectedValue(getLocaleError);
      const mockChangeLanguage = jest.fn().mockRejectedValue(changeLanguageError);

      const result = await initializeLocale(mockGetMainAppLocale, mockChangeLanguage);

      expect(result).toEqual({
        success: false,
        locale: 'en',
        error: changeLanguageError
      });
    });
  });

  describe('closeLicenseWindow', () => {
    it('should successfully close using electron API', async () => {
      const mockElectronClose = jest.fn().mockResolvedValue(undefined);
      const mockWindowClose = jest.fn();

      const result = await closeLicenseWindow(mockElectronClose, mockWindowClose);

      expect(result).toEqual({
        success: true,
        usedFallback: false
      });
      expect(mockElectronClose).toHaveBeenCalledTimes(1);
      expect(mockWindowClose).not.toHaveBeenCalled();
    });

    it('should use fallback when electron API fails', async () => {
      const error = new Error('Electron close failed');
      const mockElectronClose = jest.fn().mockRejectedValue(error);
      const mockWindowClose = jest.fn();

      const result = await closeLicenseWindow(mockElectronClose, mockWindowClose);

      expect(result).toEqual({
        success: true,
        usedFallback: true,
        error
      });
      expect(mockElectronClose).toHaveBeenCalledTimes(1);
      expect(mockWindowClose).toHaveBeenCalledTimes(1);
    });

    it('should handle both electron API and fallback failures', async () => {
      const electronError = new Error('Electron close failed');
      const fallbackError = new Error('Window close failed');
      const mockElectronClose = jest.fn().mockRejectedValue(electronError);
      const mockWindowClose = jest.fn().mockImplementation(() => {
        throw fallbackError;
      });

      const result = await closeLicenseWindow(mockElectronClose, mockWindowClose);

      expect(result).toEqual({
        success: false,
        usedFallback: true,
        error: fallbackError
      });
    });
  });

  describe('createLicenses', () => {
    it('should create licenses with translations', () => {
      const mockT = jest.fn()
        .mockReturnValueOnce('Main License Translated')
        .mockReturnValueOnce('License content translated')
        .mockReturnValueOnce('LLAMA 3.2 COMMUNITY LICENSE AGREEMENT Translated')
        .mockReturnValueOnce('Llama license content');

      const result = createLicenses(mockT);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'main',
        name: 'Main License Translated',
        content: 'License content translated'
      });
      expect(result[1].id).toBe('LLAMA-3.2-COMMUNITY-LICENSE-AGREEMENT');
      expect(result[1].name).toBe('LLAMA 3.2 COMMUNITY LICENSE AGREEMENT Translated');
      expect(result[1].content).toBeDefined(); // React component
      expect(mockT).toHaveBeenCalledWith('license.main');
      expect(mockT).toHaveBeenCalledWith('license.content');
      expect(mockT).toHaveBeenCalledWith('LLAMA-3.2-COMMUNITY-LICENSE-AGREEMENT.name');
    });

    it('should use fallback when translation returns empty', () => {
      const mockT = jest.fn()
        .mockReturnValueOnce('')
        .mockReturnValueOnce('License content')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('Llama content');

      const result = createLicenses(mockT);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'main',
        name: 'Main License',
        content: 'License content'
      });
      expect(result[1].id).toBe('LLAMA-3.2-COMMUNITY-LICENSE-AGREEMENT');
      expect(result[1].name).toBe('LLAMA 3.2 COMMUNITY LICENSE AGREEMENT');
    });

    it('should include React component for Llama license', () => {
      const mockT = jest.fn()
        .mockReturnValue('Translated');

      const result = createLicenses(mockT);

      expect(result).toHaveLength(2);
      // Check that Llama license content is a React element
      expect(typeof result[1].content).toBe('object');
      expect(result[1].content).not.toBe('string');
    });
  });

  describe('getCurrentLicense', () => {
    const licenses: License[] = [
      { id: 'main', name: 'Main', content: 'Main content' },
      { id: 'other', name: 'Other', content: 'Other content' }
    ];

    it('should return the correct license by ID', () => {
      const result = getCurrentLicense(licenses, 'other');
      expect(result).toEqual({ id: 'other', name: 'Other', content: 'Other content' });
    });

    it('should return first license when ID not found', () => {
      const result = getCurrentLicense(licenses, 'nonexistent');
      expect(result).toEqual({ id: 'main', name: 'Main', content: 'Main content' });
    });

    it('should return first license when ID is empty', () => {
      const result = getCurrentLicense(licenses, '');
      expect(result).toEqual({ id: 'main', name: 'Main', content: 'Main content' });
    });
  });

  describe('shouldShowNavigation', () => {
    it('should return false for single license', () => {
      const licenses: License[] = [
        { id: 'main', name: 'Main', content: 'Content' }
      ];
      expect(shouldShowNavigation(licenses)).toBe(false);
    });

    it('should return true for multiple licenses', () => {
      const licenses: License[] = [
        { id: 'main', name: 'Main', content: 'Content' },
        { id: 'other', name: 'Other', content: 'Other content' }
      ];
      expect(shouldShowNavigation(licenses)).toBe(true);
    });

    it('should return false for empty licenses array', () => {
      expect(shouldShowNavigation([])).toBe(false);
    });
  });

  describe('generateTitle', () => {
    const mockT = jest.fn().mockReturnValue('License');

    beforeEach(() => {
      mockT.mockClear();
    });

    it('should return singular title for single license', () => {
      const licenses: License[] = [{ id: 'main', name: 'Main', content: 'Content' }];
      const result = generateTitle(mockT, licenses);
      expect(result).toBe('License');
      expect(mockT).toHaveBeenCalledWith('license.title');
    });

    it('should return plural title for multiple licenses', () => {
      const licenses: License[] = [
        { id: 'main', name: 'Main', content: 'Content' },
        { id: 'other', name: 'Other', content: 'Other content' }
      ];
      const result = generateTitle(mockT, licenses);
      expect(result).toBe('Licenses');
      expect(mockT).toHaveBeenCalledWith('license.title');
    });
  });

  describe('validateLicenseSelection', () => {
    const licenses: License[] = [
      { id: 'main', name: 'Main', content: 'Content' },
      { id: 'other', name: 'Other', content: 'Other content' }
    ];

    it('should return valid license ID', () => {
      const result = validateLicenseSelection('other', licenses);
      expect(result).toBe('other');
    });

    it('should return first license ID for invalid selection', () => {
      const result = validateLicenseSelection('invalid', licenses);
      expect(result).toBe('main');
    });

    it('should return main for empty licenses array', () => {
      const result = validateLicenseSelection('any', []);
      expect(result).toBe('main');
    });
  });

  describe('isValidLicenseId', () => {
    const licenses: License[] = [
      { id: 'main', name: 'Main', content: 'Content' },
      { id: 'other', name: 'Other', content: 'Other content' }
    ];

    it('should return true for valid license ID', () => {
      expect(isValidLicenseId('main', licenses)).toBe(true);
      expect(isValidLicenseId('other', licenses)).toBe(true);
    });

    it('should return false for invalid license ID', () => {
      expect(isValidLicenseId('invalid', licenses)).toBe(false);
    });

    it('should return false for empty licenses array', () => {
      expect(isValidLicenseId('main', [])).toBe(false);
    });
  });

  describe('getLicenseById', () => {
    const licenses: License[] = [
      { id: 'main', name: 'Main', content: 'Content' },
      { id: 'other', name: 'Other', content: 'Other content' }
    ];

    it('should return license for valid ID', () => {
      const result = getLicenseById('other', licenses);
      expect(result).toEqual({ id: 'other', name: 'Other', content: 'Other content' });
    });

    it('should return null for invalid ID', () => {
      const result = getLicenseById('invalid', licenses);
      expect(result).toBeNull();
    });
  });

  describe('formatLocaleError', () => {
    const error = new Error('Test error');

    it('should format warning message by default', () => {
      const result = formatLocaleError(error);
      expect(result).toBe('Failed to get main app locale, using default: Test error');
    });

    it('should format warning message when explicitly set to true', () => {
      const result = formatLocaleError(error, true);
      expect(result).toBe('Failed to get main app locale, using default: Test error');
    });

    it('should format error message when warning is false', () => {
      const result = formatLocaleError(error, false);
      expect(result).toBe('Failed to initialize locale: Test error');
    });
  });

  describe('formatCloseError', () => {
    it('should format close error message', () => {
      const error = new Error('Close failed');
      const result = formatCloseError(error);
      expect(result).toBe('Failed to close license window: Close failed');
    });
  });

  describe('createLoadingState', () => {
    it('should return loading state configuration', () => {
      const result = createLoadingState();
      expect(result).toEqual({
        className: "min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4",
        textClassName: "text-white"
      });
    });
  });

  describe('createHeaderClasses', () => {
    it('should combine header classes with drag class', () => {
      const result = createHeaderClasses('drag');
      expect(result).toBe('flex flex-row items-center justify-between space-y-0 pb-4 border-b drag-region');
    });

    it('should handle non-drag class', () => {
      const result = createHeaderClasses('other');
      expect(result).toBe('flex flex-row items-center justify-between space-y-0 pb-4 border-b');
    });
  });

  describe('createCloseButtonClasses', () => {
    it('should combine close button classes with no-drag class', () => {
      const result = createCloseButtonClasses('no-drag');
      expect(result).toBe('h-8 w-8 p-0 no-drag-region');
    });

    it('should handle non-no-drag class', () => {
      const result = createCloseButtonClasses('other');
      expect(result).toBe('h-8 w-8 p-0');
    });
  });
});