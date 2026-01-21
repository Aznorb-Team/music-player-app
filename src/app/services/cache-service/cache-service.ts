import { inject, Injectable } from '@angular/core';
import {
  ETypeActionCache,
  ETypeCache,
  ICacheItem,
} from './cache-service.schema';
import { WINDOW } from '../../core/window/window-injectable';
import { NotificationService } from '../notification-service/notification-service';
import {
  ESeverityNotification,
  ESummuryNotification,
} from '../notification-service/notification-service.const';

Injectable({
  providedIn: 'root',
});
export class CacheService {
  private readonly _window = inject(WINDOW);
  private readonly _notificationService = inject(NotificationService);

  public useCacheService(
    item: ICacheItem,
    type: ETypeCache,
    typeAction: ETypeActionCache,
  ): string | null {
    if (typeAction === ETypeActionCache.LOAD) {
      return this._loadFromCache(item, type);
    } else {
      this._saveToCache(item, type);
    }

    return null;
  }

  private _saveToCache(item: ICacheItem, type: ETypeCache): void {
    switch (type) {
      case ETypeCache.LOCAL:
        this._saveToLocalStorage(item);
        break;
      case ETypeCache.SESSION:
        this._saveToSessionStorage(item);
        break;
      default:
        break;
    }
  }

  private _loadFromCache(item: ICacheItem, type: ETypeCache): string | null {
    switch (type) {
      case ETypeCache.LOCAL:
        return this._loadFromLocalStorage(item);
      case ETypeCache.SESSION:
        return this._loadFromSessionStorage(item);
      default:
        return null;
    }
  }

  private _saveToLocalStorage(item: ICacheItem): void {
    if (item.value) {
      this._window.localStorage?.setItem(item.name, item.value);
    } else {
      this._notificationService.showNotification({
        severity: ESeverityNotification.ERROR,
        summary: ESummuryNotification.ERROR,
        detail: 'Ошибка при сохранении данных в локальное хранилище!',
      });
    }
  }

  private _saveToSessionStorage(item: ICacheItem): void {
    if (item.value) {
      this._window.sessionStorage?.setItem(item.name, item.value);
    } else {
      this._notificationService.showNotification({
        severity: ESeverityNotification.ERROR,
        summary: ESummuryNotification.ERROR,
        detail: 'Ошибка при сохранении данных в сессионное хранилище!',
      });
    }
  }

  private _loadFromLocalStorage(item: ICacheItem): string | null {
    return this._window.localStorage?.getItem(item.name);
  }

  private _loadFromSessionStorage(item: ICacheItem): string | null {
    return this._window.sessionStorage?.getItem(item.name);
  }
}
