import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { MusicPlayerService } from '../../services/music-player-service/music-player-service';
import { SearchFilterService } from '../../services/search-filter-service/search-filter-service';
import { ImageFallbackDirective } from '../../core/directives/image-fallback.directive';
import { TrackCardsGridComponent } from '../track-cards-grid/track-cards-grid';
import {
  EQueueContext,
  ITrack,
} from '../../services/music-player-service/music-player-service.schema';

export interface IAlbumSummary {
  key: string;
  name: string;
  artist: string;
  coverUrl: string;
  trackCount: number;
  firstTrack: ITrack;
}

@Component({
  selector: 'app-albums',
  templateUrl: './albums.html',
  styleUrl: './albums.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Button, ImageFallbackDirective, TrackCardsGridComponent],
})
export class AlbumsComponent implements OnInit {
  private readonly _musicPlayerService = inject(MusicPlayerService);
  private readonly _route = inject(ActivatedRoute);
  protected readonly searchFilter = inject(SearchFilterService);

  protected readonly queueContext = EQueueContext;
  protected readonly selectedAlbumKey = signal<string | null>(null);
  protected readonly selectedArtistFilter = signal<string | null>(null);

  public ngOnInit(): void {
    const artist = this._route.snapshot.queryParamMap.get('artist');
    if (artist) {
      this.selectedArtistFilter.set(artist);
    }
  }

  protected readonly albums = computed(() => {
    const map = new Map<string, IAlbumSummary>();

    for (const track of this._musicPlayerService.playlist()) {
      const albumName = track.album ?? 'Без альбома';
      const key = `${track.artist}::${albumName}`;
      const existing = map.get(key);

      if (existing) {
        existing.trackCount += 1;
      } else {
        map.set(key, {
          key,
          name: albumName,
          artist: track.artist,
          coverUrl: track.coverUrl,
          trackCount: 1,
          firstTrack: track,
        });
      }
    }

    let result = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    const artistFilter = this.selectedArtistFilter();

    if (artistFilter) {
      result = result.filter((album) => album.artist === artistFilter);
    }

    if (this.searchFilter.hasActiveSearch()) {
      result = result.filter((album) =>
        this.searchFilter.matches(album.name, album.artist),
      );
    }

    return result;
  });

  protected readonly selectedAlbum = computed(() => {
    const key = this.selectedAlbumKey();
    if (!key) {
      return null;
    }

    return this.albums().find((album) => album.key === key) ?? null;
  });

  protected readonly selectedAlbumTracks = computed(() => {
    const album = this.selectedAlbum();
    if (!album) {
      return [];
    }

    return this._musicPlayerService
      .playlist()
      .filter(
        (track) =>
          track.artist === album.artist &&
          (track.album ?? 'Без альбома') === album.name,
      );
  });

  protected readonly selectedAlbumSectionTitle = computed(() => {
    const album = this.selectedAlbum();
    if (!album) {
      return '';
    }

    return `Треки альбома «${album.name}»`;
  });

  protected readonly selectedAlbumTagLabel = computed(() => {
    const album = this.selectedAlbum();
    return album?.name ?? '';
  });

  protected selectAlbum(album: IAlbumSummary): void {
    this.selectedAlbumKey.set(album.key);
  }

  protected playAlbum(album: IAlbumSummary, event?: Event): void {
    event?.stopPropagation();
    this.selectedAlbumKey.set(album.key);

    this._musicPlayerService.playTrackInContext(
      album.firstTrack,
      this.selectedAlbumTracks(),
      EQueueContext.ALBUM,
    );
  }
}
