import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Card } from 'primeng/card';
import { GENRE_ITEMS } from './genres.const';
import { SearchFilterService } from '../../services/search-filter-service/search-filter-service';

@Component({
  selector: 'app-genres',
  templateUrl: './genres.html',
  styleUrl: './genres.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
})
export class GenresComponent {
  private readonly _searchFilter = inject(SearchFilterService);

  protected readonly genres = computed(() => {
    if (!this._searchFilter.hasActiveSearch()) {
      return GENRE_ITEMS;
    }

    return GENRE_ITEMS.filter((genre) =>
      this._searchFilter.matches(genre.name, genre.description),
    );
  });
}
