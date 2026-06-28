import { MenuItem } from 'primeng/api';
import { APP_ROUTE_PATHS } from './app.routes.const';

export const SIDE_MENU_CONFIG_MAIN: MenuItem[] = [
  {
    label: 'Главная',
    icon: 'pi pi-home',
    routerLink: ['/'],
    routerLinkActiveOptions: { exact: true },
  },
  {
    label: 'Артисты',
    icon: 'pi pi-users',
    routerLink: ['/', APP_ROUTE_PATHS.ARTISTS],
  },
  {
    label: 'Альбомы',
    icon: 'pi pi-headphones',
    routerLink: ['/', APP_ROUTE_PATHS.ALBUMS],
  },
  {
    label: 'Жанры',
    icon: 'pi pi-clone',
    routerLink: ['/', APP_ROUTE_PATHS.GENRES],
  },
  {
    label: 'Плейлисты',
    icon: 'pi pi-list',
    routerLink: ['/', APP_ROUTE_PATHS.PLAYLISTS],
  },
];

export const SIDE_MENU_CONFIG_USER: MenuItem[] = [
  {
    label: 'Избранные',
    icon: 'pi pi-heart',
    routerLink: ['/', APP_ROUTE_PATHS.FAVORITES],
  },
  {
    label: 'Настройки',
    icon: 'pi pi-cog',
    routerLink: ['/', APP_ROUTE_PATHS.SETTINGS],
  },
  {
    label: 'Помощь',
    icon: 'pi pi-question-circle',
    routerLink: ['/', APP_ROUTE_PATHS.HELP],
  },
];

export enum ECacheItemName {
  THEME = 'THEME',
  VOLUME = 'VOLUME',
  SIDE_MENU_OPEN = 'SIDE_MENU_OPEN',
  SHUFFLE = 'SHUFFLE',
  REPEAT_MODE = 'REPEAT_MODE',
  FAVORITES = 'FAVORITES',
  AUTH_USER = 'AUTH_USER',
  CROSSFADE_ENABLED = 'CROSSFADE_ENABLED',
  CROSSFADE_DURATION_SEC = 'CROSSFADE_DURATION_SEC',
  PLAYBACK_POSITIONS = 'PLAYBACK_POSITIONS',
  LAST_PLAYBACK = 'LAST_PLAYBACK',
  LOCAL_LIBRARY_META = 'LOCAL_LIBRARY_META',
}

export const DARK_THEME_CLASS_NAME = 'my-app-dark';
