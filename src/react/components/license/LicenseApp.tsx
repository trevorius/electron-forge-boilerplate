import { FileText, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
// Removed styles import to eliminate CSS module dependency in tests
import {
  License,
  initializeLocale,
  closeLicenseWindow,
  createLicenses,
  getCurrentLicense,
  shouldShowNavigation,
  generateTitle,
  validateLicenseSelection,
  formatLocaleError,
  formatCloseError,
  createLoadingState,
  createHeaderClasses,
  createCloseButtonClasses
} from './LicenseApp.helpers';

const LicenseApp: React.FC = () => {
  const { t } = useTranslation();
  const [selectedLicense, setSelectedLicense] = useState<string>('main');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize locale from main app
  useEffect(() => {
    const handleInitialization = async () => {
      const result = await initializeLocale(
        () => window.electronAPI.getMainAppLocale(),
        (locale: string) => i18n.changeLanguage(locale)
      );

      if (result.error) {
        console.warn(formatLocaleError(result.error));
      }

      setIsLoading(false);
    };

    handleInitialization();
  }, []);

  const handleClose = async () => {
    const result = await closeLicenseWindow(
      () => window.electronAPI.closeLicenseWindow(),
      () => window.close()
    );

    if (!result.success || result.error) {
      console.error(formatCloseError(result.error!));
    }
  };

  const handleLicenseSelection = (licenseId: string) => {
    const validId = validateLicenseSelection(licenseId, licenses);
    setSelectedLicense(validId);
  };

  // Create license data
  const licenses: License[] = createLicenses(t);
  const currentLicense = getCurrentLicense(licenses, selectedLicense);
  const showNavigation = shouldShowNavigation(licenses);
  const title = generateTitle(t, licenses);

  if (isLoading) {
    const loadingState = createLoadingState();
    return (
      <div className={loadingState.className}>
        <div className={loadingState.textClassName}>Loading...</div>
      </div>
    );
  }

  return (
      <Card className="w-full h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur flex flex-col">
        <CardHeader className={createHeaderClasses('drag')}>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              {title}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className={createCloseButtonClasses('no-drag')}
            aria-label={t('license.close')}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-6 min-h-0">
          {/* Navigation for multiple licenses */}
          {showNavigation && (
            <div className="flex gap-2 mb-4 border-b pb-4">
              {licenses.map((license) => (
                <Button
                  key={license.id}
                  variant={selectedLicense === license.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLicenseSelection(license.id)}
                  className="text-xs"
                >
                  {license.name}
                </Button>
              ))}
            </div>
          )}

          {/* License content */}
          <div className="flex-1 overflow-auto min-h-0">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border">
              <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">
                {currentLicense.name}
              </h3>
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed text-slate-700 dark:text-slate-300">
                {currentLicense.content}
              </pre>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t mt-4">
            <Button onClick={handleClose} variant="default">
              {t('license.close')}
            </Button>
          </div>
        </CardContent>
      </Card>
  );
};

export default LicenseApp;