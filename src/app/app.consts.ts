import { MenuItem } from 'primeng/api';

export const SIDE_MENU_CONFIG_MAIN: MenuItem[] = [
  {
    label: 'Главная',
    icon: 'pi pi-home',
  },
  {
    label: 'Артисты',
    icon: 'pi pi-users',
  },
  {
    label: 'Альбомы',
    icon: 'pi pi-headphones',
  },
  {
    label: 'Жанры',
    icon: 'pi pi-clone',
  },
  {
    label: 'Плейлисты',
    icon: 'pi pi-list',
  },
];

export const SIDE_MENU_CONFIG_USER: MenuItem[] = [
  {
    label: 'Избранные',
    icon: 'pi pi-heart',
  },
  {
    label: 'Настройки',
    icon: 'pi pi-cog',
  },
  {
    label: 'Помощь',
    icon: 'pi pi-question-circle',
  },
];

export enum ECacheItemName {
  THEME = 'THEME',
  VOLUME = 'VOLUME',
  SIDE_MENU_OPEN = 'SIDE_MENU_OPEN',
}

export const DARK_THEME_CLASS_NAME = 'my-app-dark';
