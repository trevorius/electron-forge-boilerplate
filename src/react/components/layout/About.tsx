import React from 'react';
import { useTranslation } from 'react-i18next';
import packageInfo from '../../../../package.json';
import LanguageSelector from '../common/LanguageSelector';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const About: React.FC = () => {
  const { t } = useTranslation();

  const handleOpenLicense = async () => {
    try {
      await window.electronAPI.openLicenseWindow();
    } catch (error) {
      console.error('Failed to open license window:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto bg-card backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-end">
            <LanguageSelector />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">
            {t('about.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground leading-relaxed">
              {t('about.description')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-semibold text-muted-foreground">
                {t('about.version')}:
              </span>
              <span className="text-muted-foreground">
                {packageInfo?.version || '0.0.0'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-semibold text-muted-foreground">
                {t('about.author')}:
              </span>
              <span className="text-muted-foreground">
                {packageInfo?.author || 'Unknown'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-semibold text-muted-foreground">
                {t('about.license')}:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {packageInfo?.license || 'MIT'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenLicense}
                  className="h-6 px-2 text-xs text-gradient-from hover:text-gradient-to"
                >
                  {t('about.viewLicense')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;
