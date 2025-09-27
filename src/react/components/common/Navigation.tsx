import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { routes } from '../../routes';

const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    return path !== '/' && location.pathname === path;
  };

  return (
    <nav className="fixed top-4 left-4 z-10">
      <div className="flex gap-2">
        {routes.map((route) => {
          const IconComponent = route.icon;
          return (
            <Link key={route.path} to={route.path}>
              <Button
                variant={isActive(route.path) ? 'default' : 'outline'}
                className="gap-2"
              >
                <IconComponent className="h-4 w-4" />
                {t(route.title)}
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;