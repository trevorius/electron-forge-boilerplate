import { Brain, Gamepad2, Home, Info, LucideIcon, MessageSquare, Settings as SettingsIcon } from 'lucide-react';
import React from 'react';
import LineDestroyer from './components/game/LineDestroyer';
import TicTacToe from './components/game/TicTacToe';
import About from './components/layout/About';
import Game from './components/layout/Game';
import ChatPage from './pages/Chat';
import Settings from './pages/Settings';
import LLMSettings from './pages/Settings/LLMSettings';

export interface Route {
  path: string;
  component: React.ComponentType;
  title: string; // i18n key for the title
  icon: LucideIcon;
  exact?: boolean;
  children?: Route[];
  inNavbar?: boolean;
}

export const routes: Route[] = [
  {
    path: '/',
    component: Game,
    title: 'nav.home',
    icon: Home,
    exact: true,
    inNavbar: true
  },
  {
    path: '/game',
    component: Game,
    title: 'nav.games',
    icon: Gamepad2,
    inNavbar: true,
    children: [
      {
        path: '/game/lineDestroyer',
        component: LineDestroyer,
        title: 'nav.games_menu.lineDestroyer',
        icon: Gamepad2,
        inNavbar: false
      },
      {
        path: '/game/tictactoe',
        component: TicTacToe,
        title: 'nav.games_menu.tictactoe',
        icon: Gamepad2,
        inNavbar: false
      }
    ]
  },
  {
    path: '/chat',
    component: ChatPage,
    title: 'nav.chat',
    icon: MessageSquare,
    inNavbar: true
  },
  {
    path: '/settings',
    component: Settings,
    title: 'nav.settings',
    icon: SettingsIcon,
    inNavbar: true,
    children: [
      {
        path: '/settings/llm',
        component: LLMSettings,
        title: 'nav.settings_menu.llm',
        icon: Brain,
        inNavbar: false
      }
    ]
  },
  {
    path: '/about',
    component: About,
    title: 'nav.about',
    icon: Info,
    inNavbar: true
  },
];

export default routes;
