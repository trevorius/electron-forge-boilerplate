import { FileText, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import styles from './LicenseApp.module.css';

interface License {
  id: string;
  name: string;
  content: string;
}

const LicenseApp: React.FC = () => {
  const { t } = useTranslation();
  const [selectedLicense, setSelectedLicense] = useState<string>('main');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize locale from main app
  useEffect(() => {
    const initializeLocale = async () => {
      try {
        const mainAppLocale = await window.electronAPI.getMainAppLocale();
        await i18n.changeLanguage(mainAppLocale || 'en');
      } catch (error) {
        console.warn('Failed to get main app locale, using default', error);
        await i18n.changeLanguage('en');
      } finally {
        setIsLoading(false);
      }
    };

    initializeLocale();
  }, []);

  const handleClose = async () => {
    try {
      await window.electronAPI.closeLicenseWindow();
    } catch (error) {
      console.error('Failed to close license window:', error);
      // Fallback: close the window manually
      window.close();
    }
  };

  // Define available licenses (extensible for future)
  const licenses: License[] = [
    {
      id: 'main',
      name: t('license.main', 'Main License'),
      content: t('license.content')
    }
    // Future licenses can be added here
  ];

  const currentLicense = licenses.find(license => license.id === selectedLicense) || licenses[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
      <Card className="w-full h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur flex flex-col overflow-hidden">
        <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-4 border-b ${styles.drag}`}>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              {t('license.title')}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
            aria-label={t('license.close')}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col p-6">
          {/* Navigation for multiple licenses (future extensibility) */}
          {licenses.length > 1 && (
            <div className="flex gap-2 mb-4 border-b pb-4">
              {licenses.map((license) => (
                <Button
                  key={license.id}
                  variant={selectedLicense === license.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLicense(license.id)}
                  className="text-xs"
                >
                  {license.name}
                </Button>
              ))}
            </div>
          )}

          {/* License content */}
          <div className="flex-1 overflow-auto">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border h-full">
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
