import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { CacheService } from '../cache-service/cache-service';
import {
  ETypeActionCache,
  ETypeCache,
  ICacheItem,
} from '../cache-service/cache-service.schema';
import { DARK_THEME_CLASS_NAME, ECacheItemName } from '../../app.consts';

@Injectable({
  providedIn: 'root',
})
export class AppSettingsService {
  private readonly _cacheService = inject(CacheService);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _document = inject(DOCUMENT);

  readonly isDarkMode = signal(false);
  readonly isSidebarExpanded = signal(true);

  public initFromCache(): void {
    this.isDarkMode.set(this._loadBoolean(ECacheItemName.THEME, false));
    this.isSidebarExpanded.set(
      this._loadBoolean(ECacheItemName.SIDE_MENU_OPEN, true),
    );
    this._applyDarkModeClass(this.isDarkMode());
  }

  public setDarkMode(enabled: boolean): void {
    this.isDarkMode.set(enabled);
    this._saveBoolean(ECacheItemName.THEME, enabled);
    this._applyDarkModeClass(enabled);
  }

  public setSidebarExpanded(expanded: boolean): void {
    this.isSidebarExpanded.set(expanded);
    this._saveBoolean(ECacheItemName.SIDE_MENU_OPEN, expanded);
  }

  public clearLocalData(): void {
    if (!this._isBrowser) {
      return;
    }

    const storage = this._document.defaultView?.localStorage;
    if (!storage) {
      return;
    }

    for (const key of Object.values(ECacheItemName)) {
      storage.removeItem(key);
    }

    this.setDarkMode(false);
    this.setSidebarExpanded(true);
  }

  private _loadBoolean(name: ECacheItemName, fallback: boolean): boolean {
    const item: ICacheItem = { name };
    const value = this._cacheService.useCacheService(
      item,
      ETypeCache.LOCAL,
      ETypeActionCache.LOAD,
    );

    if (!value) {
      return fallback;
    }

    try {
      const parsed: unknown = JSON.parse(value);
      return typeof parsed === 'boolean' ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  private _saveBoolean(name: ECacheItemName, value: boolean): void {
    const item: ICacheItem = {
      name,
      value: JSON.stringify(value),
    };

    this._cacheService.useCacheService(
      item,
      ETypeCache.LOCAL,
      ETypeActionCache.SAVE,
    );
  }

  private _applyDarkModeClass(enabled: boolean): void {
    if (!this._isBrowser) {
      return;
    }

    const root = this._document.documentElement;
    root.classList.toggle(DARK_THEME_CLASS_NAME, enabled);
  }

  private get _isBrowser(): boolean {
    return isPlatformBrowser(this._platformId);
  }
}
