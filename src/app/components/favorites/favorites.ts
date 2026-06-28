import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { FavoritesService } from '../../services/favorites-service/favorites-service';
import { MusicPlayerService } from '../../services/music-player-service/music-player-service';
import { ImageFallbackDirective } from '../../core/directives/image-fallback.directive';
import {
  EQueueContext,
  ITrack,
} from '../../services/music-player-service/music-player-service.schema';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.html',
  styleUrl: './favorites.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Button, ImageFallbackDirective],
})
export class FavoritesComponent {
  private readonly _musicPlayerService = inject(MusicPlayerService);
  protected readonly favoritesService = inject(FavoritesService);

  constructor() {
    this.favoritesService.ensureLoaded();
  }

  protected toggleTrack(track: ITrack): void {
    if (this.isCurrentTrack(track)) {
      this._musicPlayerService.togglePlayPause();
      return;
    }

    this._musicPlayerService.playTrackInContext(
      track,
      this.favoritesService.favoriteTracks(),
      EQueueContext.FAVORITES,
    );
  }

  protected removeFavorite(track: ITrack): void {
    this.favoritesService.removeFavorite(track.id);
  }

  protected isCurrentTrack(track: ITrack): boolean {
    return this._musicPlayerService.currentTrack().id === track.id;
  }

  protected isPlayingTrack(track: ITrack): boolean {
    return (
      this.isCurrentTrack(track) && this._musicPlayerService.isPlaying()
    );
  }

  protected trackButtonIcon(track: ITrack): string {
    return this.isPlayingTrack(track) ? 'pi pi-pause' : 'pi pi-play';
  }
}
