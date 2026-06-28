import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { MusicPlayerService } from '../../services/music-player-service/music-player-service';
import { ContentService } from '../../services/content-service/content-service';
import { SearchFilterService } from '../../services/search-filter-service/search-filter-service';
import {
  EQueueContext,
  ITrack,
} from '../../services/music-player-service/music-player-service.schema';

interface IAlbumSummary {
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
  imports: [Card, Button],
})
export class AlbumsComponent {
  private readonly _musicPlayerService = inject(MusicPlayerService);
  protected readonly contentService = inject(ContentService);
  protected readonly searchFilter = inject(SearchFilterService);

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
          name: albumName,
          artist: track.artist,
          coverUrl: track.coverUrl,
          trackCount: 1,
          firstTrack: track,
        });
      }
    }

    let result = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));

    if (this.searchFilter.hasActiveSearch()) {
      result = result.filter((album) =>
        this.searchFilter.matches(album.name, album.artist),
      );
    }

    return result;
  });

  protected playAlbum(album: IAlbumSummary): void {
    const albumTracks = this._musicPlayerService
      .playlist()
      .filter(
        (track) =>
          track.artist === album.artist &&
          (track.album ?? 'Без альбома') === album.name,
      );

    this._musicPlayerService.playTrackInContext(
      album.firstTrack,
      albumTracks,
      EQueueContext.ALBUM,
    );
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;

    if (img.src.includes(this.contentService.getImageFallback())) {
      return;
    }

    img.src = this.contentService.getImageFallback();
  }
}
