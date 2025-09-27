import { Languages } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLanguage = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLanguage);
  };

  return (
    <Button
      onClick={toggleLanguage}
      variant="outline"
      className="gap-2"
      title={t('language.switch')}
    >
      <Languages className="h-4 w-4" />
      {i18n.language === 'en' ? t('language.french') : t('language.english')}
    </Button>
  );
};

export default LanguageSelector;
