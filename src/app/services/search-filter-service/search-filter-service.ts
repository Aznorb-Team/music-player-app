import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SearchFilterService {
  readonly searchQuery = signal('');

  readonly normalizedQuery = computed(() =>
    this.searchQuery().trim().toLowerCase(),
  );

  readonly hasActiveSearch = computed(
    () => this.normalizedQuery().length > 0,
  );

  public setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  public clearSearch(): void {
    this.searchQuery.set('');
  }

  public matches(...values: (string | undefined | null)[]): boolean {
    const query = this.normalizedQuery();

    if (!query) {
      return true;
    }

    return values.some((value) => value?.toLowerCase().includes(query));
  }
}
