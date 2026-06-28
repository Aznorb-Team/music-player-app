import { Routes } from '@angular/router';
import { APP_ROUTE_PATHS } from './app.routes.const';

export const routes: Routes = [
  {
    path: APP_ROUTE_PATHS.HOME,
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/main/main').then((m) => m.MainComponent),
    title: 'Главная',
  },
  {
    path: APP_ROUTE_PATHS.ARTISTS,
    loadComponent: () =>
      import('./components/artists/artists').then((m) => m.ArtistsComponent),
    title: 'Артисты',
  },
  {
    path: APP_ROUTE_PATHS.ALBUMS,
    loadComponent: () =>
      import('./components/albums/albums').then((m) => m.AlbumsComponent),
    title: 'Альбомы',
  },
  {
    path: APP_ROUTE_PATHS.GENRES,
    loadComponent: () =>
      import('./components/genres/genres').then((m) => m.GenresComponent),
    title: 'Жанры',
  },
  {
    path: APP_ROUTE_PATHS.PLAYLISTS,
    loadComponent: () =>
      import('./components/playlists/playlists').then(
        (m) => m.PlaylistsComponent,
      ),
    title: 'Плейлисты',
  },
  {
    path: APP_ROUTE_PATHS.FAVORITES,
    loadComponent: () =>
      import('./components/favorites/favorites').then(
        (m) => m.FavoritesComponent,
      ),
    title: 'Избранные',
  },
  {
    path: APP_ROUTE_PATHS.SETTINGS,
    loadComponent: () =>
      import('./components/settings/settings').then((m) => m.SettingsComponent),
    title: 'Настройки',
  },
  {
    path: APP_ROUTE_PATHS.HELP,
    loadComponent: () =>
      import('./components/help/help').then((m) => m.HelpComponent),
    title: 'Помощь',
  },
  {
    path: '**',
    redirectTo: APP_ROUTE_PATHS.HOME,
  },
];
