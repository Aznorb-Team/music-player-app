import { ITrack } from '../../services/music-player-service/music-player-service.schema';
import { ARTIST_GENRE_MAP, GENRE_ITEMS, IGenreItem } from './genres.const';

export function getTrackGenreIds(track: ITrack): string[] {
  if (track.genres?.length) {
    return track.genres;
  }

  return ARTIST_GENRE_MAP[track.artist] ?? [];
}

export function getTracksByGenreId(
  tracks: readonly ITrack[],
  genreId: string,
): ITrack[] {
  return tracks.filter((track) => getTrackGenreIds(track).includes(genreId));
}

export function buildGenreCatalog(tracks: readonly ITrack[]): IGenreItem[] {
  const items = [...GENRE_ITEMS];
  const knownIds = new Set(items.map((genre) => genre.id));

  for (const track of tracks) {
    for (const genreId of getTrackGenreIds(track)) {
      if (knownIds.has(genreId)) {
        continue;
      }

      knownIds.add(genreId);
      items.push({
        id: genreId,
        name: formatGenreLabel(genreId),
        description: 'Жанр из вашей библиотеки',
        icon: 'pi pi-music',
      });
    }
  }

  return items;
}

export function enrichGenresWithTrackCount(
  genres: readonly IGenreItem[],
  tracks: readonly ITrack[],
): Array<IGenreItem & { trackCount: number }> {
  return genres.map((genre) => ({
    ...genre,
    trackCount: getTracksByGenreId(tracks, genre.id).length,
  }));
}

function formatGenreLabel(genreId: string): string {
  return genreId
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
