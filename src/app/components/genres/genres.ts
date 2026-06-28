import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { GENRE_ITEMS } from './genres.const';
import { enrichGenresWithTrackCount, getTracksByGenreId } from './genres.util';
import { SearchFilterService } from '../../services/search-filter-service/search-filter-service';
import { MusicPlayerService } from '../../services/music-player-service/music-player-service';
import { APP_ROUTE_PATHS } from '../../app.routes.const';
import { TrackCardsGridComponent } from '../track-cards-grid/track-cards-grid';
import { EQueueContext } from '../../services/music-player-service/music-player-service.schema';

@Component({
  selector: 'app-genres',
  templateUrl: './genres.html',
  styleUrl: './genres.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Button, TrackCardsGridComponent],
})
export class GenresComponent {
  private readonly _musicPlayer = inject(MusicPlayerService);
  private readonly _router = inject(Router);
  private readonly _searchFilter = inject(SearchFilterService);

  protected readonly queueContext = EQueueContext;
  protected readonly selectedGenreId = signal<string | null>(null);

  protected readonly genres = computed(() => {
    const tracks = this._musicPlayer.playlist();
    let items = enrichGenresWithTrackCount(GENRE_ITEMS, tracks);

    if (this._searchFilter.hasActiveSearch()) {
      items = items.filter((genre) =>
        this._searchFilter.matches(genre.name, genre.description),
      );
    }

    return items;
  });

  protected readonly selectedGenreTracks = computed(() => {
    const genreId = this.selectedGenreId();
    if (!genreId) {
      return [];
    }

    return getTracksByGenreId(this._musicPlayer.playlist(), genreId);
  });

  protected readonly selectedGenreName = computed(() => {
    const genreId = this.selectedGenreId();
    return GENRE_ITEMS.find((genre) => genre.id === genreId)?.name ?? '';
  });

  protected readonly selectedGenreSectionTitle = computed(() => {
    const name = this.selectedGenreName();
    return name ? `Треки жанра «${name}»` : '';
  });

  protected selectGenre(genreId: string): void {
    this.selectedGenreId.set(genreId);
  }

  protected playGenre(genreId: string, event?: Event): void {
    event?.stopPropagation();
    this.selectedGenreId.set(genreId);
    this._musicPlayer.playByGenre(genreId);
  }

  protected openArtistsForGenre(genreId: string, event: Event): void {
    event.stopPropagation();
    void this._router.navigate(['/', APP_ROUTE_PATHS.ARTISTS], {
      queryParams: { genre: genreId },
    });
  }
}
