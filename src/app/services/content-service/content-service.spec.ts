import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContentService } from './content-service';
import { EConcertStatus } from './content-service.schema';
import { SearchFilterService } from '../search-filter-service/search-filter-service';

describe('ContentService', () => {
  let service: ContentService;
  let searchFilter: SearchFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(ContentService);
    searchFilter = TestBed.inject(SearchFilterService);
    searchFilter.clearSearch();
    service.clearContentFilters();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return all concerts when city is not selected', () => {
    expect(service.filteredConcerts().length).toBe(service.concerts().length);
  });

  it('should filter concerts by city', () => {
    service.setSelectedCity('Berlin');

    const concerts = service.filteredConcerts();
    expect(concerts.length).toBeGreaterThan(0);
    expect(concerts.every((concert) => concert.city === 'Berlin')).toBeTrue();
  });

  it('should filter concerts by status', () => {
    service.setSelectedConcertStatus(EConcertStatus.SOLD_OUT);

    const concerts = service.filteredConcerts();
    expect(concerts.length).toBeGreaterThan(0);
    expect(
      concerts.every((concert) => concert.status === EConcertStatus.SOLD_OUT),
    ).toBeTrue();
  });

  it('should filter news by category', () => {
    const category = service.newsCategories()[0];
    service.setSelectedNewsCategory(category);

    const news = service.filteredNewsItems();
    expect(news.length).toBeGreaterThan(0);
    expect(news.every((item) => item.category === category)).toBeTrue();
  });

  it('should filter news and concerts by search query', () => {
    searchFilter.setSearchQuery('Bad Omens');

    expect(service.filteredNewsItems().length).toBeGreaterThan(0);
    expect(service.filteredConcerts().length).toBeGreaterThan(0);
    expect(
      service.filteredNewsItems().every((item) =>
        item.title.includes('Bad Omens') || item.artist?.includes('Bad Omens'),
      ),
    ).toBeTrue();
  });

  it('should open and resolve selected news', () => {
    service.openNewsDetail('2');

    expect(service.selectedNewsId()).toBe('2');
    expect(service.selectedNews()?.title).toContain('Cyberhex');
  });

  it('should clear selected news', () => {
    service.openNewsDetail('1');
    service.closeNewsDetail();

    expect(service.selectedNewsId()).toBeNull();
    expect(service.selectedNews()).toBeNull();
  });

  it('should return concert status severity', () => {
    expect(service.getConcertStatusSeverity(EConcertStatus.AVAILABLE)).toBe(
      'success',
    );
    expect(service.getConcertStatusSeverity(EConcertStatus.FEW_LEFT)).toBe(
      'warn',
    );
    expect(service.getConcertStatusSeverity(EConcertStatus.SOLD_OUT)).toBe(
      'danger',
    );
  });

  it('should format ticket price in rubles', () => {
    expect(service.formatTicketPrice(6500)).toContain('6');
    expect(service.formatTicketPrice(6500)).toContain('₽');
  });

  it('should find concerts by artist', () => {
    const concerts = service.getConcertsByArtist('Bad Omens');

    expect(concerts.length).toBeGreaterThan(0);
    expect(concerts.every((concert) => concert.artist === 'Bad Omens')).toBeTrue();
  });
});
