import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import LanguageSelector from '../common/LanguageSelector';
import LicenseModal from '../common/LicenseModal';
import packageInfo from '../../../../package.json';

const About: React.FC = () => {
  const { t } = useTranslation();
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-end">
            <LanguageSelector />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            {t('about.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('about.description')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {t('about.version')}:
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {packageInfo?.version || '0.0.0'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {t('about.author')}:
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {packageInfo?.author || 'Unknown'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {t('about.license')}:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400">
                  {packageInfo?.license || 'MIT'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLicenseModalOpen(true)}
                  className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {t('about.viewLicense')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
      />
    </div>
  );
};

export default About;