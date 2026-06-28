import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { PanelModule } from 'primeng/panel';
import { MenuItem } from 'primeng/api';
import { PanelMenu } from 'primeng/panelmenu';
import { BadgeModule } from 'primeng/badge';
import { Ripple } from 'primeng/ripple';
import {
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
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MusicPlayerComponent } from './components/music-player/music-player';
import { Toast } from 'primeng/toast';
import { Avatar } from 'primeng/avatar';
import { SearchFilterService } from './services/search-filter-service/search-filter-service';
import { SearchDiscoveryService } from './services/search-filter-service/search-discovery-service';
import { FavoritesService } from './services/favorites-service/favorites-service';
import { AppSettingsService } from './services/app-settings-service/app-settings-service';
import { AuthService } from './services/auth-service/auth-service';
import { MusicPlayerService } from './services/music-player-service/music-player-service';
import { IMAGE_FALLBACK_URL } from './core/constants/image-fallback.const';
import { LoginDialogComponent } from './components/login-dialog/login-dialog';
import { ISearchResultItem } from './services/search-filter-service/search-filter-service.schema';
import { ProgressSpinner } from 'primeng/progressspinner';

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
    LoginDialogComponent,
    ProgressSpinner,
  ],
  templateUrl: './app.html',
  styleUrl: './app.less',
})
export class App implements OnInit {
  private readonly _dr = inject(DestroyRef);
  private readonly _router = inject(Router);
  private readonly _searchFilter = inject(SearchFilterService);
  private readonly _searchDiscovery = inject(SearchDiscoveryService);
  private readonly _favoritesService = inject(FavoritesService);
  private readonly _appSettings = inject(AppSettingsService);
  private readonly _authService = inject(AuthService);
  private readonly _musicPlayer = inject(MusicPlayerService);

  protected readonly title = signal('Music Player');
  protected readonly itemsMain = signal<MenuItem[]>([]);
  protected readonly itemsUser = signal<MenuItem[]>([]);
  protected readonly searchFilter = this._searchFilter;
  protected readonly searchDiscovery = this._searchDiscovery;
  protected readonly appSettings = this._appSettings;
  protected readonly authService = this._authService;
  protected readonly logoUrl = IMAGE_FALLBACK_URL;
  protected readonly showLoginDialog = signal(false);
  protected readonly searchFocused = signal(false);
  protected readonly isRouteLoading = signal(false);

  protected searchControl = new FormControl('', { nonNullable: true });

  private _routeLoadingDelayTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this._favoritesService.ensureLoaded();
    this._authService.ensureLoaded();
    this._appSettings.initFromCache();

    effect(() => {
      this._favoritesService.favoritesCount();
      this._updateUserMenuItems();
    });
  }

  public ngOnInit(): void {
    this._initSideMenuConfig();
    this._subscribeOnSearch();
    this._syncSearchControlFromService();
    this._listenRouteLoading();
  }

  protected submitSearch(): void {
    this._searchFilter.setSearchQuery(this.searchControl.value);
  }

  protected clearSearch(): void {
    this.searchControl.setValue('');
    this._searchFilter.clearSearch();
    this.searchFocused.set(false);
  }

  protected onSearchFocus(): void {
    this.searchFocused.set(true);
  }

  protected onSearchBlur(): void {
    setTimeout(() => this.searchFocused.set(false), 150);
  }

  protected toggleFullSidebarMenu(): void {
    this._appSettings.setSidebarExpanded(!this._appSettings.isSidebarExpanded());
  }

  protected onDarkModeChange(enabled: boolean): void {
    this._appSettings.setDarkMode(enabled);
  }

  protected openLogin(): void {
    if (this._authService.isAuthenticated()) {
      this._authService.logout();
      return;
    }

    this.showLoginDialog.set(true);
  }

  protected closeLoginDialog(): void {
    this.showLoginDialog.set(false);
  }

  protected loginButtonLabel(): string {
    return this._authService.isAuthenticated() ? 'Выйти' : 'Войти';
  }

  protected selectSearchResult(item: ISearchResultItem): void {
    if (item.trackId) {
      const track = this._musicPlayer
        .playlist()
        .find((entry) => entry.id === item.trackId);
      if (track) {
        this._musicPlayer.playTrack(track);
      }
    } else if (item.artistName) {
      this._musicPlayer.playByArtist(item.artistName);
    }

    if (item.route) {
      void this._router.navigate(item.route);
    }

    this.clearSearch();
  }

  protected resultIcon(type: ISearchResultItem['type']): string {
    switch (type) {
      case 'track':
        return 'pi pi-play';
      case 'artist':
        return 'pi pi-user';
      case 'album':
        return 'pi pi-headphones';
      case 'news':
        return 'pi pi-megaphone';
      case 'concert':
        return 'pi pi-calendar';
      default:
        return 'pi pi-search';
    }
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

  private _syncSearchControlFromService(): void {
    if (this._searchFilter.searchQuery()) {
      this.searchControl.setValue(this._searchFilter.searchQuery(), {
        emitEvent: false,
      });
    }
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

  private _listenRouteLoading(): void {
    this._router.events.pipe(takeUntilDestroyed(this._dr)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this._routeLoadingDelayTimer = setTimeout(() => {
          this.isRouteLoading.set(true);
        }, 120);
        return;
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        if (this._routeLoadingDelayTimer !== null) {
          clearTimeout(this._routeLoadingDelayTimer);
          this._routeLoadingDelayTimer = null;
        }

        this.isRouteLoading.set(false);
      }
    });
  }
}
