import { computed, inject, Injectable, signal } from '@angular/core';
import {
  CITY_GROUPS,
  CONCERTS,
  NEWS_CAROUSEL_RESPONSIVE_OPTIONS,
  NEWS_ITEMS,
} from './content-service.const';
import { EConcertStatus, IConcert, INewsItem } from './content-service.schema';
import { SearchFilterService } from '../search-filter-service/search-filter-service';

@Injectable({
  providedIn: 'root',
})
export class ContentService {
  private readonly _searchFilter = inject(SearchFilterService);

  readonly newsItems = signal<INewsItem[]>(NEWS_ITEMS);
  readonly concerts = signal<IConcert[]>(CONCERTS);
  readonly cityGroups = signal(CITY_GROUPS);
  readonly newsCarouselOptions = NEWS_CAROUSEL_RESPONSIVE_OPTIONS;
  readonly selectedCity = signal<string | undefined>(undefined);
  readonly selectedConcertStatus = signal<EConcertStatus | undefined>(
    undefined,
  );
  readonly selectedNewsCategory = signal<string | undefined>(undefined);
  readonly selectedGenreId = signal<string | undefined>(undefined);
  readonly selectedNewsId = signal<string | null>(null);

  readonly newsCategories = computed(() =>
    [...new Set(this.newsItems().map((item) => item.category))].sort(),
  );

  readonly newsCategoryOptions = computed(() =>
    this.newsCategories().map((category) => ({
      label: category,
      value: category,
    })),
  );

  readonly concertStatusOptions = computed(() =>
    Object.values(EConcertStatus).map((status) => ({
      label: status,
      value: status,
    })),
  );

  readonly selectedNews = computed(() => {
    const id = this.selectedNewsId();
    return id ? this.getNewsById(id) : null;
  });

  readonly filteredNewsItems = computed(() => {
    let items = this.newsItems();
    const category = this.selectedNewsCategory();

    if (category) {
      items = items.filter((item) => item.category === category);
    }

    if (this._searchFilter.hasActiveSearch()) {
      items = items.filter((item) =>
        this._searchFilter.matches(
          item.title,
          item.summary,
          item.artist,
          item.category,
          item.source,
        ),
      );
    }

    return items;
  });

  readonly filteredConcerts = computed(() => {
    let items = this.concerts();
    const city = this.selectedCity();
    const status = this.selectedConcertStatus();

    if (city) {
      items = items.filter((concert) => concert.city === city);
    }

    if (status) {
      items = items.filter((concert) => concert.status === status);
    }

    if (this._searchFilter.hasActiveSearch()) {
      items = items.filter((concert) =>
        this._searchFilter.matches(
          concert.artist,
          concert.venue,
          concert.city,
          concert.country,
        ),
      );
    }

    return items;
  });

  public setSelectedCity(city: string | undefined): void {
    this.selectedCity.set(city);
  }

  public setSelectedConcertStatus(status: EConcertStatus | undefined): void {
    this.selectedConcertStatus.set(status);
  }

  public setSelectedNewsCategory(category: string | undefined): void {
    this.selectedNewsCategory.set(category);
  }

  public setSelectedGenreId(genreId: string | undefined): void {
    this.selectedGenreId.set(genreId);
  }

  public clearContentFilters(): void {
    this.selectedCity.set(undefined);
    this.selectedConcertStatus.set(undefined);
    this.selectedNewsCategory.set(undefined);
    this.selectedGenreId.set(undefined);
  }

  public getNewsById(id: string): INewsItem | undefined {
    return this.newsItems().find((item) => item.id === id);
  }

  public openNewsDetail(id: string): void {
    this.selectedNewsId.set(id);
  }

  public closeNewsDetail(): void {
    this.selectedNewsId.set(null);
  }

  public getConcertById(id: string): IConcert | undefined {
    return this.concerts().find((item) => item.id === id);
  }

  public getConcertsByArtist(artist: string): IConcert[] {
    return this.concerts().filter((item) => item.artist === artist);
  }

  public getConcertStatusSeverity(
    status: EConcertStatus,
  ): 'success' | 'warn' | 'danger' {
    switch (status) {
      case EConcertStatus.AVAILABLE:
        return 'success';
      case EConcertStatus.FEW_LEFT:
        return 'warn';
      case EConcertStatus.SOLD_OUT:
        return 'danger';
    }
  }

  public formatTicketPrice(priceRub: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(priceRub);
  }
}
