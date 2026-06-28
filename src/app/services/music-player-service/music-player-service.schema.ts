export interface ITrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  src: string;
  coverUrl: string;
  source?: string;
  lyrics?: string;
  genres?: string[];
  localPath?: string;
}

export enum ELibrarySource {
  BUILTIN = 'builtin',
  LOCAL = 'local',
}

export enum ERepeatMode {
  OFF = 'off',
  ALL = 'all',
  ONE = 'one',
}

export enum EQueueContext {
  FULL = 'full',
  PLAYLIST = 'playlist',
  FAVORITES = 'favorites',
  ARTIST = 'artist',
  ALBUM = 'album',
  GENRE = 'genre',
}

export const QUEUE_CONTEXT_LABELS: Record<EQueueContext, string> = {
  [EQueueContext.FULL]: 'Весь плейлист',
  [EQueueContext.PLAYLIST]: 'Плейлист',
  [EQueueContext.FAVORITES]: 'Избранное',
  [EQueueContext.ARTIST]: 'Артист',
  [EQueueContext.ALBUM]: 'Альбом',
  [EQueueContext.GENRE]: 'Жанр',
};