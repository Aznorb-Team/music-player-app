import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SearchFilterService } from './search-filter-service';

describe('SearchFilterService', () => {
  let service: SearchFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(SearchFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should match text case-insensitively', () => {
    service.setSearchQuery('bad');

    expect(service.matches('Bad Omens', 'Berlin')).toBeTrue();
    expect(service.matches('Falling In Reverse')).toBeFalse();
  });

  it('should match all items when query is empty', () => {
    service.setSearchQuery('');

    expect(service.matches('anything')).toBeTrue();
  });

  it('should clear search query', () => {
    service.setSearchQuery('rock');
    service.clearSearch();

    expect(service.hasActiveSearch()).toBeFalse();
  });
});
