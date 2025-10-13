// LicenseApp helpers - Pure functions for business logic that can be easily tested
import { Llama32CommunityLicenseAgreement } from './Llama32CommunityLicenseAgreement.tsx';

export interface License {
  id: string;
  name: string;
  content: string | React.ReactNode;
}

export interface LocaleInitResult {
  success: boolean;
  locale: string;
  error?: Error;
}

export interface WindowCloseResult {
  success: boolean;
  usedFallback: boolean;
  error?: Error;
}

/**
 * Initialize locale by getting it from the main app
 */
export const initializeLocale = async (
  getMainAppLocale: () => Promise<string>,
  changeLanguage: (locale: string) => Promise<any>
): Promise<LocaleInitResult> => {
  try {
    const mainAppLocale = await getMainAppLocale();
    const locale = mainAppLocale || 'en';
    await changeLanguage(locale);
    return { success: true, locale };
  } catch (error) {
    try {
      await changeLanguage('en');
      return { success: true, locale: 'en', error: error as Error };
    } catch (fallbackError) {
      return { success: false, locale: 'en', error: fallbackError as Error };
    }
  }
};

/**
 * Handle closing the license window with fallback
 */
export const closeLicenseWindow = async (
  electronClose: () => Promise<void>,
  windowClose: () => void
): Promise<WindowCloseResult> => {
  try {
    await electronClose();
    return { success: true, usedFallback: false };
  } catch (error) {
    try {
      windowClose();
      return { success: true, usedFallback: true, error: error as Error };
    } catch (fallbackError) {
      return { success: false, usedFallback: true, error: fallbackError as Error };
    }
  }
};

/**
 * Create the list of available licenses
 */
export const createLicenses = (
  t: (key: string, options?: any) => string
): License[] => {
  return [
    {
      id: 'main',
      name: t('license.main') || 'Main License',
      content: t('license.content')
    },
    {
      id: 'LLAMA-3.2-COMMUNITY-LICENSE-AGREEMENT',
      name: t('LLAMA-3.2-COMMUNITY-LICENSE-AGREEMENT.name') || 'LLAMA 3.2 COMMUNITY LICENSE AGREEMENT',
      content: <Llama32CommunityLicenseAgreement t={t} />
    }
    // Future licenses can be added here
  ];
};

/**
 * Get the current license by ID
 */
export const getCurrentLicense = (
  licenses: License[],
  selectedId: string
): License => {
  return licenses.find(license => license.id === selectedId) || licenses[0];
};

/**
 * Check if multiple licenses should show navigation
 */
export const shouldShowNavigation = (licenses: License[]): boolean => {
  return licenses.length > 1;
};

/**
 * Generate title text with plural handling
 */
export const generateTitle = (
  t: (key: string) => string,
  licenses: License[]
): string => {
  const baseTitle = t('license.title');
  return shouldShowNavigation(licenses) ? `${baseTitle}s` : baseTitle;
};

/**
 * Validate license selection and return safe ID
 */
export const validateLicenseSelection = (
  selectedId: string,
  licenses: License[]
): string => {
  const validIds = licenses.map(license => license.id);
  return validIds.includes(selectedId) ? selectedId : licenses[0]?.id || 'main';
};

/**
 * Check if a license ID exists in the licenses array
 */
export const isValidLicenseId = (licenseId: string, licenses: License[]): boolean => {
  return licenses.some(license => license.id === licenseId);
};

/**
 * Get license by ID with error handling
 */
export const getLicenseById = (licenseId: string, licenses: License[]): License | null => {
  return licenses.find(license => license.id === licenseId) || null;
};

/**
 * Format error messages for locale initialization
 */
export const formatLocaleError = (error: Error, isWarning: boolean = true): string => {
  const prefix = isWarning ? 'Failed to get main app locale, using default' : 'Failed to initialize locale';
  return `${prefix}: ${error.message}`;
};

/**
 * Format error messages for window closing
 */
export const formatCloseError = (error: Error): string => {
  return `Failed to close license window: ${error.message}`;
};

/**
 * Create loading state configuration
 */
export const createLoadingState = () => ({
  className: "min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4",
  textClassName: "text-white"
});

/**
 * Create CSS class combinations with actual drag/no-drag styles
 */
export const createHeaderClasses = (dragType: string): string => {
  const dragClasses = dragType === 'drag' ? 'drag-region' : '';
  return `flex flex-row items-center justify-between space-y-0 pb-4 border-b ${dragClasses}`.trim();
};

export const createCloseButtonClasses = (noDragType: string): string => {
  const noDragClasses = noDragType === 'no-drag' ? 'no-drag-region' : '';
  return `h-8 w-8 p-0 ${noDragClasses}`.trim();
};
