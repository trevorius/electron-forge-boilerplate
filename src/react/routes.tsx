import React from 'react';
import { Home, Info, LucideIcon } from 'lucide-react';
import Game from './components/layout/Game';
import About from './components/layout/About';

export interface Route {
  path: string;
  component: React.ComponentType;
  title: string; // i18n key for the title
  icon: LucideIcon;
  exact?: boolean;
}

export const routes: Route[] = [
  {
    path: '/',
    component: Game,
    title: 'navigation.home',
    icon: Home,
    exact: true
  },
  {
    path: '/about',
    component: About,
    title: 'navigation.about',
    icon: Info
  }
];

export default routes;