import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { MusicPlayerService } from '../../services/music-player-service/music-player-service';
import { FavoritesService } from '../../services/favorites-service/favorites-service';
import { ImageFallbackDirective } from '../../core/directives/image-fallback.directive';
import {
  EQueueContext,
  ITrack,
} from '../../services/music-player-service/music-player-service.schema';

@Component({
  selector: 'app-playlists',
  templateUrl: './playlists.html',
  styleUrl: './playlists.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Button, ImageFallbackDirective],
})
export class PlaylistsComponent {
  private readonly _musicPlayerService = inject(MusicPlayerService);
  protected readonly favoritesService = inject(FavoritesService);

  protected readonly playlist = this._musicPlayerService.filteredPlaylist;
  protected readonly currentTrack = this._musicPlayerService.currentTrack;
  protected readonly isPlaying = this._musicPlayerService.isPlaying;

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
      this.playlist(),
      EQueueContext.PLAYLIST,
    );
  }

  protected toggleFavorite(track: ITrack): void {
    this.favoritesService.toggleFavorite(track);
  }

  protected isFavorite(track: ITrack): boolean {
    return this.favoritesService.isFavorite(track.id);
  }

  protected trackButtonIcon(track: ITrack): string {
    return this.isCurrentTrack(track) && this.isPlaying()
      ? 'pi pi-pause'
      : 'pi pi-play';
  }

  protected isCurrentTrack(track: ITrack): boolean {
    return this.currentTrack().id === track.id;
  }
}
