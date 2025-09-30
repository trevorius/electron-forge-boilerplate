import React from 'react';
import { useTranslation } from 'react-i18next';

const Settings: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">{t('settings.title')}</h1>
        <p className="text-muted-foreground">
          {t('settings.select_submenu')}
        </p>
      </div>
    </div>
  );
};

export default Settings;