import { computed, inject, Injectable } from '@angular/core';
import { APP_ROUTE_PATHS } from '../../app.routes.const';
import { ContentService } from '../content-service/content-service';
import { MusicPlayerService } from '../music-player-service/music-player-service';
import { SearchFilterService } from './search-filter-service';
import { ISearchResultItem } from './search-filter-service.schema';

const MAX_RESULTS = 8;

@Injectable({
  providedIn: 'root',
})
export class SearchDiscoveryService {
  private readonly _searchFilter = inject(SearchFilterService);
  private readonly _musicPlayer = inject(MusicPlayerService);
  private readonly _content = inject(ContentService);

  readonly results = computed(() => {
    if (!this._searchFilter.hasActiveSearch()) {
      return [] as ISearchResultItem[];
    }

    const items: ISearchResultItem[] = [];
    const seenArtists = new Set<string>();
    const seenAlbums = new Set<string>();

    for (const track of this._musicPlayer.playlist()) {
      if (
        !this._searchFilter.matches(
          track.title,
          track.artist,
          track.album,
          track.lyrics,
        )
      ) {
        continue;
      }

      items.push({
        id: `track-${track.id}`,
        type: 'track',
        title: track.title,
        subtitle: track.artist,
        trackId: track.id,
        route: ['/', APP_ROUTE_PATHS.PLAYLISTS],
      });

      if (!seenArtists.has(track.artist)) {
        seenArtists.add(track.artist);
        items.push({
          id: `artist-${track.artist}`,
          type: 'artist',
          title: track.artist,
          subtitle: 'Артист',
          artistName: track.artist,
          route: ['/', APP_ROUTE_PATHS.ARTISTS],
        });
      }

      const albumKey = `${track.artist}::${track.album ?? ''}`;
      if (track.album && !seenAlbums.has(albumKey)) {
        seenAlbums.add(albumKey);
        items.push({
          id: `album-${albumKey}`,
          type: 'album',
          title: track.album,
          subtitle: track.artist,
          route: ['/', APP_ROUTE_PATHS.ALBUMS],
        });
      }
    }

    for (const news of this._content.filteredNewsItems()) {
      items.push({
        id: `news-${news.id}`,
        type: 'news',
        title: news.title,
        subtitle: news.category,
        route: ['/'],
      });
    }

    for (const concert of this._content.filteredConcerts()) {
      items.push({
        id: `concert-${concert.id}`,
        type: 'concert',
        title: concert.artist,
        subtitle: `${concert.city}, ${concert.venue}`,
        route: ['/'],
      });
    }

    return items.slice(0, MAX_RESULTS);
  });

  readonly resultsCount = computed(() => this.results().length);

  readonly hasNoResults = computed(
    () =>
      this._searchFilter.hasActiveSearch() && this.results().length === 0,
  );
}
