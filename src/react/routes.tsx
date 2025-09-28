import React from 'react';
import { Home, Info, Gamepad2, LucideIcon } from 'lucide-react';
import Game from './components/layout/Game';
import About from './components/layout/About';
import Tetris from './components/game/Tetris';
import TicTacToe from './components/game/TicTacToe';

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
        path: '/game/tetris',
        component: Tetris,
        title: 'nav.games_menu.tetris',
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
    path: '/about',
    component: About,
    title: 'nav.about',
    icon: Info,
    inNavbar: true
  }
];

export default routes;