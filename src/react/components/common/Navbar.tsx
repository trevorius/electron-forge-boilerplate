import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gamepad2 } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '../ui/navigation-menu';
import { cn } from '../../lib/utils';
import LanguageSelector from './LanguageSelector';
import WindowControls from './WindowControls';
import { routes } from '../../routes';
import { useModel } from '../../contexts/ModelContext';

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { currentModelInfo } = useModel();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Filter routes that should appear in navbar
  const navbarRoutes = routes.filter(route => route.inNavbar);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Titlebar with draggable area */}
      <div className="h-12 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b flex items-center justify-between px-3">
        {/* Left side - App icon only */}
        <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <div className="flex items-center gap-2 px-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
          </div>
        </div>

        {/* Center section - Navigation with drag areas on sides */}
        <div className="flex-1 flex items-center">
          {/* Left drag area */}
          <div className="flex-1 h-12" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}></div>

          {/* Navigation menu (no-drag) */}
          <div className="flex justify-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <NavigationMenu>
            <NavigationMenuList>
              {navbarRoutes.map((route) => {
                const Icon = route.icon;

                if (route.children && route.children.length > 0) {
                  // Route with children - render as dropdown
                  return (
                    <NavigationMenuItem key={route.path}>
                      <NavigationMenuTrigger className={cn(
                        isActive(route.path) && 'bg-accent text-accent-foreground'
                      )}>
                        <Icon className="h-4 w-4 mr-2" />
                        {t(route.title)}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                          {route.children.map((childRoute) => (
                            <li key={childRoute.path} className="row-span-1">
                              <NavigationMenuLink asChild>
                                <Link
                                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                  to={childRoute.path}
                                >
                                  <div className="text-sm font-medium leading-none">
                                    {t(childRoute.title)}
                                  </div>
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    {t(`${childRoute.title}_description`)}
                                  </p>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  );
                } else {
                  // Simple route - render as link
                  return (
                    <NavigationMenuItem key={route.path}>
                      <NavigationMenuLink asChild>
                        <Link
                          to={route.path}
                          className={cn(
                            navigationMenuTriggerStyle(),
                            isActive(route.path) && 'bg-accent text-accent-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {t(route.title)}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                }
              })}
            </NavigationMenuList>
          </NavigationMenu>
          </div>

          {/* Right drag area */}
          <div className="flex-1 h-12" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}></div>
        </div>

        {/* Right side - Attribution badge, Language selector and window controls */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {currentModelInfo?.requiresAttribution && (
            <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-md mr-2">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                {currentModelInfo.attributionText}
              </span>
            </div>
          )}
          <div className="mr-2">
            <LanguageSelector />
          </div>
          <WindowControls />
        </div>
      </div>
    </div>
  );
};

export default Navbar;