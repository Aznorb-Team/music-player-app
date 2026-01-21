import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
import { InputGroup } from 'primeng/inputgroup';
import { InputText } from 'primeng/inputtext';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { Button } from 'primeng/button';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MusicPlayerComponent } from './components/music-player/music-player';
import { CacheService } from './services/cache-service/cache-service';
import { tap, filter } from 'rxjs';
import {
  ETypeActionCache,
  ETypeCache,
  ICacheItem,
} from './services/cache-service/cache-service.schema';
import { Toast } from 'primeng/toast';
import { NotificationService } from './services/notification-service/notification-service';
import {
  ESeverityNotification,
  ESummuryNotification,
} from './services/notification-service/notification-service.const';
import { Avatar } from 'primeng/avatar';

@Component({
  selector: 'app-root',
  imports: [
    PanelMenu,
    BadgeModule,
    Ripple,
    CommonModule,
    PanelModule,
    RouterOutlet,
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
  private _dr = inject(DestroyRef);
  private _cacheService = inject(CacheService);
  private _notificationService = inject(NotificationService);

  protected readonly title = signal('Music Player');
  protected readonly itemsMain = signal<MenuItem[]>([]);
  protected readonly itemsUser = signal<MenuItem[]>([]);
  protected isDarkMode = new FormControl<boolean>(false);
  protected isFullSidebarMenu = new FormControl<boolean>(true);

  public ngOnInit(): void {
    this._initSideMenuConfig();
    this._subscribeOnDarkModeToggle();
    this._subscribeOnSideBarToggle();
    this._loadStartDate();
  }

  protected toggleFullSidebarMenu(): void {
    this.isFullSidebarMenu.setValue(!this.isFullSidebarMenu.getRawValue());
  }

  private _initSideMenuConfig(): void {
    this.itemsMain.set(SIDE_MENU_CONFIG_MAIN);
    this.itemsUser.set(SIDE_MENU_CONFIG_USER);
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
      this.isDarkMode.setValue(JSON.parse(valueTheme) || false);
    }
  }

  private _loadSideBarMenu(): void {
    const themeItem: ICacheItem = {
      name: ECacheItemName.SIDE_MENU_OPEN,
    };

    const valueTheme = this._cacheService.useCacheService(
      themeItem,
      ETypeCache.LOCAL,
      ETypeActionCache.LOAD,
    );

    if (valueTheme) {
      this.isFullSidebarMenu.setValue(JSON.parse(valueTheme));
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
}
