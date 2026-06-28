import { RenderMode, ServerRoute } from '@angular/ssr';
import { APP_ROUTE_PATHS } from './app.routes.const';

export const serverRoutes: ServerRoute[] = [
  {
    path: APP_ROUTE_PATHS.HOME,
    renderMode: RenderMode.Prerender,
  },
  {
    path: APP_ROUTE_PATHS.ARTISTS,
    renderMode: RenderMode.Prerender,
  },
  {
    path: APP_ROUTE_PATHS.ALBUMS,
    renderMode: RenderMode.Prerender,
  },
  {
    path: APP_ROUTE_PATHS.GENRES,
    renderMode: RenderMode.Prerender,
  },
  {
    path: APP_ROUTE_PATHS.PLAYLISTS,
    renderMode: RenderMode.Prerender,
  },
  {
    path: APP_ROUTE_PATHS.FAVORITES,
    renderMode: RenderMode.Prerender,
  },
  {
    path: APP_ROUTE_PATHS.SETTINGS,
    renderMode: RenderMode.Prerender,
  },
  {
    path: APP_ROUTE_PATHS.HELP,
    renderMode: RenderMode.Prerender,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
