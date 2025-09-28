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

  const getLanguageDisplay = () => {
    return i18n.language === 'en' ? 'Fr' : 'En';
  };

  return (
    <Button
      onClick={toggleLanguage}
      variant="ghost"
      size="sm"
      className="h-8 px-2 text-xs font-medium"
      title={t('language.switch')}
    >
      {getLanguageDisplay()}
    </Button>
  );
};

export default LanguageSelector;
