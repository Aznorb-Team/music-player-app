import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { FavoritesService } from './favorites-service';
import { MusicPlayerService } from '../music-player-service/music-player-service';
import { DEFAULT_PLAYLIST } from '../music-player-service/music-player-service.const';
import { WINDOW } from '../../core/window/window-injectable';

function createStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => store.delete(key),
    setItem: (key: string, value: string) => store.set(key, value),
  };
}

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        MessageService,
        {
          provide: WINDOW,
          useValue: {
            localStorage: createStorageMock(),
            sessionStorage: createStorageMock(),
          },
        },
      ],
    });

    service = TestBed.inject(FavoritesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle favorite track', () => {
    const track = DEFAULT_PLAYLIST[0];

    expect(service.isFavorite(track.id)).toBeFalse();

    service.toggleFavorite(track);

    expect(service.isFavorite(track.id)).toBeTrue();
    expect(service.favoriteTracks()).toEqual([track]);

    service.toggleFavorite(track);

    expect(service.isFavorite(track.id)).toBeFalse();
    expect(service.favoriteTracks().length).toBe(0);
  });

  it('should remove favorite by id', () => {
    const track = DEFAULT_PLAYLIST[1];
    service.toggleFavorite(track);
    service.removeFavorite(track.id);

    expect(service.isFavorite(track.id)).toBeFalse();
  });
});
