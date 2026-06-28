import { ChangeDetectionStrategy, Component, computed, inject, model } from '@angular/core';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { MusicPlayerService } from '../../services/music-player-service/music-player-service';
import { ContentService } from '../../services/content-service/content-service';
import { SearchFilterService } from '../../services/search-filter-service/search-filter-service';
import {
  ARTIST_GENRE_MAP,
  GENRE_ITEMS,
} from '../genres/genres.const';
import { ImageFallbackDirective } from '../../core/directives/image-fallback.directive';

@Component({
  selector: 'app-artists',
  templateUrl: './artists.html',
  styleUrl: './artists.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Button, Select, FormsModule, ImageFallbackDirective],
})
export class ArtistsComponent {
  private readonly _musicPlayerService = inject(MusicPlayerService);
  protected readonly contentService = inject(ContentService);
  protected readonly searchFilter = inject(SearchFilterService);

  protected readonly selectedGenreId = model<string | undefined>(undefined);

  protected readonly genreOptions = GENRE_ITEMS.map((genre) => ({
    label: genre.name,
    value: genre.id,
  }));

  protected readonly artists = computed(() => {
    const map = new Map<
      string,
      { name: string; coverUrl: string; trackCount: number }
    >();

    for (const track of this._musicPlayerService.playlist()) {
      const existing = map.get(track.artist);

      if (existing) {
        existing.trackCount += 1;
      } else {
        map.set(track.artist, {
          name: track.artist,
          coverUrl: track.coverUrl,
          trackCount: 1,
        });
      }
    }

    let result = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    const genreId = this.selectedGenreId();

    if (genreId) {
      result = result.filter((artist) =>
        ARTIST_GENRE_MAP[artist.name]?.includes(genreId),
      );
    }

    if (this.searchFilter.hasActiveSearch()) {
      result = result.filter((artist) =>
        this.searchFilter.matches(artist.name),
      );
    }

    return result;
  });

  protected onGenreChange(genreId: string | undefined): void {
    this.selectedGenreId.set(genreId);
    this.contentService.setSelectedGenreId(genreId);
  }

  protected playArtist(artist: string): void {
    this._musicPlayerService.playByArtist(artist);
  }
}
