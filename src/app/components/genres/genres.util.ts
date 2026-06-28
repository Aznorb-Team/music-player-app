import { ITrack } from '../../services/music-player-service/music-player-service.schema';
import { ARTIST_GENRE_MAP, IGenreItem } from './genres.const';

export function getTracksByGenreId(
  tracks: readonly ITrack[],
  genreId: string,
): ITrack[] {
  return tracks.filter((track) =>
    ARTIST_GENRE_MAP[track.artist]?.includes(genreId),
  );
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
