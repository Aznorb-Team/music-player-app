import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PanelModule } from 'primeng/panel';
import { MenuItem } from 'primeng/api';
import { PanelMenu } from 'primeng/panelmenu';
import { BadgeModule } from 'primeng/badge';
import { Ripple } from 'primeng/ripple';
import {
  DARK_THEME_CLASS_NAME,
  ECacheItemName,
  SIDE_MENU_CONFIG_MAIN,
  SIDE_MENU_CONFIG_USER,
} from './app.consts';
import { APP_ROUTE_PATHS } from './app.routes.const';
import { InputGroup } from 'primeng/inputgroup';
import { InputText } from 'primeng/inputtext';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { Button } from 'primeng/button';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MusicPlayerComponent } from './components/music-player/music-player';
import { CacheService } from './services/cache-service/cache-service';
import { tap, filter, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  ETypeActionCache,
  ETypeCache,
  ICacheItem,
} from './services/cache-service/cache-service.schema';
import { Toast } from 'primeng/toast';
import { Avatar } from 'primeng/avatar';
import { SearchFilterService } from './services/search-filter-service/search-filter-service';
import { FavoritesService } from './services/favorites-service/favorites-service';
import { IMAGE_FALLBACK_URL } from './core/constants/image-fallback.const';

@Component({
  selector: 'app-root',
  imports: [
    PanelMenu,
    BadgeModule,
    Ripple,
    CommonModule,
    PanelModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    InputGroup,
    InputText,
    InputGroupAddon,
    Button,
    ToggleSwitch,
    FormsModule,
    ReactiveFormsModule,
    MusicPlayerComponent,
    Toast,
    Avatar,
  ],
  templateUrl: './app.html',
  styleUrl: './app.less',
})
export class App implements OnInit {
  private readonly _dr = inject(DestroyRef);
  private readonly _cacheService = inject(CacheService);
  private readonly _searchFilter = inject(SearchFilterService);
  private readonly _favoritesService = inject(FavoritesService);

  protected readonly title = signal('Music Player');
  protected readonly itemsMain = signal<MenuItem[]>([]);
  protected readonly itemsUser = signal<MenuItem[]>([]);
  protected readonly searchFilter = this._searchFilter;
  protected readonly logoUrl = IMAGE_FALLBACK_URL;
  protected isDarkMode = new FormControl<boolean>(false);
  protected isFullSidebarMenu = new FormControl<boolean>(true);
  protected searchControl = new FormControl('', { nonNullable: true });

  constructor() {
    this._favoritesService.ensureLoaded();

    effect(() => {
      this._favoritesService.favoritesCount();
      this._updateUserMenuItems();
    });
  }

  public ngOnInit(): void {
    this._initSideMenuConfig();
    this._subscribeOnDarkModeToggle();
    this._subscribeOnSideBarToggle();
    this._subscribeOnSearch();
    this._loadStartDate();
  }

  protected submitSearch(): void {
    this._searchFilter.setSearchQuery(this.searchControl.value);
  }

  protected clearSearch(): void {
    this.searchControl.setValue('');
    this._searchFilter.clearSearch();
  }

  protected toggleFullSidebarMenu(): void {
    this.isFullSidebarMenu.setValue(!this.isFullSidebarMenu.getRawValue());
  }

  private _initSideMenuConfig(): void {
    this.itemsMain.set(SIDE_MENU_CONFIG_MAIN);
    this._updateUserMenuItems();
  }

  private _updateUserMenuItems(): void {
    const count = this._favoritesService.favoritesCount();

    this.itemsUser.set(
      SIDE_MENU_CONFIG_USER.map((item) => ({
        ...item,
        badge:
          item.routerLink?.[1] === APP_ROUTE_PATHS.FAVORITES && count > 0
            ? String(count)
            : undefined,
      })),
    );
  }

  private _loadStartDate(): void {
    this._loadTheme();
    this._loadSideBarMenu();
  }

  private _loadTheme(): void {
    const themeItem: ICacheItem = {
      name: ECacheItemName.THEME,
    };

    const valueTheme = this._cacheService.useCacheService(
      themeItem,
      ETypeCache.LOCAL,
      ETypeActionCache.LOAD,
    );

    if (valueTheme) {
      this.isDarkMode.setValue(this._parseCachedBoolean(valueTheme, false));
    }
  }

  private _loadSideBarMenu(): void {
    const sideBarItem: ICacheItem = {
      name: ECacheItemName.SIDE_MENU_OPEN,
    };

    const valueSideBar = this._cacheService.useCacheService(
      sideBarItem,
      ETypeCache.LOCAL,
      ETypeActionCache.LOAD,
    );

    if (valueSideBar) {
      this.isFullSidebarMenu.setValue(
        this._parseCachedBoolean(valueSideBar, true),
      );
    }
  }

  private _parseCachedBoolean(value: string, fallback: boolean): boolean {
    try {
      const parsed: unknown = JSON.parse(value);
      return typeof parsed === 'boolean' ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  private _subscribeOnDarkModeToggle(): void {
    this.isDarkMode.valueChanges
      .pipe(
        filter((value) => typeof value === 'boolean'),
        tap((value) => {
          const themeItem: ICacheItem = {
            name: ECacheItemName.THEME,
            value: value?.toString(),
          };

          this._cacheService.useCacheService(
            themeItem,
            ETypeCache.LOCAL,
            ETypeActionCache.SAVE,
          );
        }),
        takeUntilDestroyed(this._dr),
      )
      .subscribe((value) => {
        const element = document.querySelector('html');
        if (element) {
          if (value) {
            if (!element.classList.contains(DARK_THEME_CLASS_NAME)) {
              element.classList.add(DARK_THEME_CLASS_NAME);
            }
          } else {
            if (element.classList.contains(DARK_THEME_CLASS_NAME)) {
              element.classList.remove(DARK_THEME_CLASS_NAME);
            }
          }
        }
      });
  }

  private _subscribeOnSideBarToggle(): void {
    this.isFullSidebarMenu.valueChanges
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe((value) => {
        const sideBarItem: ICacheItem = {
          name: ECacheItemName.SIDE_MENU_OPEN,
          value: value?.toString(),
        };

        this._cacheService.useCacheService(
          sideBarItem,
          ETypeCache.LOCAL,
          ETypeActionCache.SAVE,
        );
      });
  }

  private _subscribeOnSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this._dr),
      )
      .subscribe((query) => {
        this._searchFilter.setSearchQuery(query);
      });
  }
}
