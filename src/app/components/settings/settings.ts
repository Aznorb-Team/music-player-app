import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Card } from 'primeng/card';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Slider } from 'primeng/slider';
import { Button } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { MusicPlayerService } from '../../services/music-player-service/music-player-service';
import { AppSettingsService } from '../../services/app-settings-service/app-settings-service';
import { LocalLibraryService } from '../../services/local-library-service/local-library-service';
import { ELocalLibraryStatus } from '../../services/local-library-service/local-library-service.schema';
import { ERepeatMode } from '../../services/music-player-service/music-player-service.schema';
import {
  CROSSFADE_DURATION_MAX_SEC,
  CROSSFADE_DURATION_MIN_SEC,
} from '../../services/music-player-service/music-player-playback.const';
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
  protected readonly localLibrary = inject(LocalLibraryService);
  protected readonly favoritesService = inject(FavoritesService);
  protected readonly authService = inject(AuthService);
  private readonly _notificationService = inject(NotificationService);

  protected readonly repeatMode = ERepeatMode;
  protected readonly crossfadeMinSec = CROSSFADE_DURATION_MIN_SEC;
  protected readonly crossfadeMaxSec = CROSSFADE_DURATION_MAX_SEC;
  protected readonly libraryStatus = ELocalLibraryStatus;

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

  protected onCrossfadeChange(enabled: boolean): void {
    this.musicPlayerService.setCrossfadeEnabled(enabled);
  }

  protected onCrossfadeDurationChange(seconds: number): void {
    this.musicPlayerService.setCrossfadeDurationSec(seconds);
  }

  protected async pickMusicFolder(): Promise<void> {
    await this.localLibrary.pickFolder();
  }

  protected async reconnectMusicFolder(): Promise<void> {
    await this.localLibrary.reconnectFolder();
  }

  protected async rescanMusicFolder(): Promise<void> {
    await this.localLibrary.rescanFolder();
  }

  protected async disconnectMusicFolder(): Promise<void> {
    await this.localLibrary.disconnect();
  }

  protected libraryDescription(): string {
    if (!this.localLibrary.isSupported()) {
      return 'Доступно в Chrome и Edge на компьютере';
    }

    if (this.localLibrary.isActive()) {
      const folder = this.localLibrary.folderName();
      const count = this.localLibrary.trackCount();
      return folder ? `«${folder}» · ${count} треков` : `${count} треков`;
    }

    const folder = this.localLibrary.folderName();

    if (folder) {
      return `«${folder}» · требуется повторное подключение`;
    }

    return 'Воспроизведение MP3 и других форматов с вашего компьютера';
  }

  protected async clearLocalData(): Promise<void> {
    await this.localLibrary.disconnect();
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
