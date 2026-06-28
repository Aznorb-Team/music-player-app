import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  model,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { MusicPlayerService } from '../../services/music-player-service/music-player-service';
import { ContentService } from '../../services/content-service/content-service';
import { SearchFilterService } from '../../services/search-filter-service/search-filter-service';
import { buildGenreCatalog, getTrackGenreIds } from '../genres/genres.util';
import { ImageFallbackDirective } from '../../core/directives/image-fallback.directive';
import { TrackCardsGridComponent } from '../track-cards-grid/track-cards-grid';
import { APP_ROUTE_PATHS } from '../../app.routes.const';
import { EQueueContext } from '../../services/music-player-service/music-player-service.schema';

interface IArtistSummary {
  name: string;
  coverUrl: string;
  trackCount: number;
}

@Component({
  selector: 'app-artists',
  templateUrl: './artists.html',
  styleUrl: './artists.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Card,
    Button,
    Select,
    FormsModule,
    ImageFallbackDirective,
    TrackCardsGridComponent,
  ],
})
export class ArtistsComponent implements OnInit {
  private readonly _musicPlayerService = inject(MusicPlayerService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  protected readonly contentService = inject(ContentService);
  protected readonly searchFilter = inject(SearchFilterService);

  protected readonly queueContext = EQueueContext;
  protected readonly selectedGenreId = model<string | undefined>(undefined);
  protected readonly selectedArtistName = signal<string | null>(null);

  public ngOnInit(): void {
    const genre = this._route.snapshot.queryParamMap.get('genre');
    if (genre) {
      this.selectedGenreId.set(genre);
      this.contentService.setSelectedGenreId(genre);
    }
  }

  protected readonly genreOptions = computed(() =>
    buildGenreCatalog(this._musicPlayerService.playlist()).map((genre) => ({
      label: genre.name,
      value: genre.id,
    })),
  );

  protected readonly artists = computed(() => {
    const map = new Map<string, IArtistSummary>();

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
        this._musicPlayerService
          .playlist()
          .some(
            (track) =>
              track.artist === artist.name &&
              getTrackGenreIds(track).includes(genreId),
          ),
      );
    }

    if (this.searchFilter.hasActiveSearch()) {
      result = result.filter((artist) =>
        this.searchFilter.matches(artist.name),
      );
    }

    return result;
  });

  protected readonly selectedArtistTracks = computed(() => {
    const artistName = this.selectedArtistName();
    if (!artistName) {
      return [];
    }

    return this._musicPlayerService
      .playlist()
      .filter((track) => track.artist === artistName);
  });

  protected readonly selectedArtistSectionTitle = computed(() => {
    const name = this.selectedArtistName();
    return name ? `Треки артиста «${name}»` : '';
  });

  protected onGenreChange(genreId: string | undefined): void {
    this.selectedGenreId.set(genreId);
    this.contentService.setSelectedGenreId(genreId);
    this.selectedArtistName.set(null);
  }

  protected selectArtist(artistName: string): void {
    this.selectedArtistName.set(artistName);
  }

  protected playArtist(artistName: string, event?: Event): void {
    event?.stopPropagation();
    this.selectedArtistName.set(artistName);
    this._musicPlayerService.playByArtist(artistName);
  }

  protected openAlbumsForArtist(artistName: string, event: Event): void {
    event.stopPropagation();
    void this._router.navigate(['/', APP_ROUTE_PATHS.ALBUMS], {
      queryParams: { artist: artistName },
    });
  }
}
