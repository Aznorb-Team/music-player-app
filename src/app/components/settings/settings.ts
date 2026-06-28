import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Card } from 'primeng/card';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Slider } from 'primeng/slider';
import { Button } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { MusicPlayerService } from '../../services/music-player-service/music-player-service';
import { AppSettingsService } from '../../services/app-settings-service/app-settings-service';
import { ERepeatMode } from '../../services/music-player-service/music-player-service.schema';
import { FavoritesService } from '../../services/favorites-service/favorites-service';
import { AuthService } from '../../services/auth-service/auth-service';
import { NotificationService } from '../../services/notification-service/notification-service';
import {
  ESeverityNotification,
  ESummaryNotification,
} from '../../services/notification-service/notification-service.const';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrl: './settings.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, ToggleSwitch, Slider, Button, FormsModule],
})
export class SettingsComponent {
  protected readonly musicPlayerService = inject(MusicPlayerService);
  protected readonly appSettings = inject(AppSettingsService);
  protected readonly favoritesService = inject(FavoritesService);
  protected readonly authService = inject(AuthService);
  private readonly _notificationService = inject(NotificationService);

  protected readonly repeatMode = ERepeatMode;

  constructor() {
    this.favoritesService.ensureLoaded();
    this.authService.ensureLoaded();
  }

  protected onDarkModeChange(enabled: boolean): void {
    this.appSettings.setDarkMode(enabled);
  }

  protected onSidebarChange(expanded: boolean): void {
    this.appSettings.setSidebarExpanded(expanded);
  }

  protected onVolumeChange(value: number): void {
    this.musicPlayerService.setVolume(value);
  }

  protected onShuffleChange(enabled: boolean): void {
    if (enabled !== this.musicPlayerService.shuffle()) {
      this.musicPlayerService.toggleShuffle();
    }
  }

  protected setRepeatMode(mode: ERepeatMode): void {
    this.musicPlayerService.setRepeatMode(mode);
  }

  protected clearLocalData(): void {
    this.appSettings.clearLocalData();
    this.favoritesService.reloadFromCache();
    this.authService.clearSession();
    this._notificationService.showNotification({
      severity: ESeverityNotification.INFO,
      summary: ESummaryNotification.INFO,
      detail: 'Локальные настройки сброшены',
    });
  }

  protected logout(): void {
    this.authService.logout();
  }
}
