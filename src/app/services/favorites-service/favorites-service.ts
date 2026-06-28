import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CacheService } from '../cache-service/cache-service';
import {
  ETypeActionCache,
  ETypeCache,
  ICacheItem,
} from '../cache-service/cache-service.schema';
import { ECacheItemName } from '../../app.consts';
import { MusicPlayerService } from '../music-player-service/music-player-service';
import { ITrack } from '../music-player-service/music-player-service.schema';
import { NotificationService } from '../notification-service/notification-service';
import {
  ESeverityNotification,
  ESummaryNotification,
} from '../notification-service/notification-service.const';

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private readonly _cacheService = inject(CacheService);
  private readonly _musicPlayerService = inject(MusicPlayerService);
  private readonly _notificationService = inject(NotificationService);
  private readonly _platformId = inject(PLATFORM_ID);

  private readonly _favoriteIds = signal<string[]>([]);
  private _loaded = false;

  readonly favoriteIds = this._favoriteIds.asReadonly();

  readonly favoriteTracks = computed(() => {
    const ids = new Set(this._favoriteIds());
    return this._musicPlayerService
      .playlist()
      .filter((track) => ids.has(track.id));
  });

  readonly favoritesCount = computed(() => this._favoriteIds().length);

  public ensureLoaded(): void {
    if (this._loaded || !this._isBrowser) {
      return;
    }

    this._loaded = true;

    const item: ICacheItem = { name: ECacheItemName.FAVORITES };
    const cached = this._cacheService.useCacheService(
      item,
      ETypeCache.LOCAL,
      ETypeActionCache.LOAD,
    );

    if (!cached) {
      return;
    }

    try {
      const ids = JSON.parse(cached) as string[];
      if (Array.isArray(ids)) {
        this._favoriteIds.set(ids);
      }
    } catch {
      this._favoriteIds.set([]);
    }
  }

  public isFavorite(trackId: string): boolean {
    this.ensureLoaded();
    return this._favoriteIds().includes(trackId);
  }

  public toggleFavorite(track: ITrack): boolean {
    this.ensureLoaded();

    const isFavorite = this.isFavorite(track.id);
    const nextIds = isFavorite
      ? this._favoriteIds().filter((id) => id !== track.id)
      : [...this._favoriteIds(), track.id];

    this._favoriteIds.set(nextIds);
    this._persist(nextIds);

    this._notificationService.showNotification({
      severity: ESeverityNotification.SUCCESS,
      summary: ESummaryNotification.SUCCESS,
      detail: isFavorite
        ? `«${track.title}» удалён из избранного`
        : `«${track.title}» добавлен в избранное`,
    });

    return !isFavorite;
  }

  public removeFavorite(trackId: string): void {
    this.ensureLoaded();

    if (!this.isFavorite(trackId)) {
      return;
    }

    const track = this._musicPlayerService
      .playlist()
      .find((item) => item.id === trackId);
    const nextIds = this._favoriteIds().filter((id) => id !== trackId);

    this._favoriteIds.set(nextIds);
    this._persist(nextIds);

    if (track) {
      this._notificationService.showNotification({
        severity: ESeverityNotification.INFO,
        summary: ESummaryNotification.INFO,
        detail: `«${track.title}» удалён из избранного`,
      });
    }
  }

  private _persist(ids: string[]): void {
    const item: ICacheItem = {
      name: ECacheItemName.FAVORITES,
      value: JSON.stringify(ids),
    };

    this._cacheService.useCacheService(
      item,
      ETypeCache.LOCAL,
      ETypeActionCache.SAVE,
    );
  }

  private get _isBrowser(): boolean {
    return isPlatformBrowser(this._platformId);
  }
}
