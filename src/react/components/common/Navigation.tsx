import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Home, Info } from 'lucide-react';

const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-4 left-4 z-10">
      <div className="flex gap-2">
        <Link to="/">
          <Button
            variant={isActive('/') ? 'default' : 'outline'}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            {t('navigation.home')}
          </Button>
        </Link>
        <Link to="/about">
          <Button
            variant={isActive('/about') ? 'default' : 'outline'}
            className="gap-2"
          >
            <Info className="h-4 w-4" />
            {t('navigation.about')}
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;