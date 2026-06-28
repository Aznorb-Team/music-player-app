import { NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { ImageFallbackDirective } from '../../core/directives/image-fallback.directive';
import { MusicPlayerService } from '../../services/music-player-service/music-player-service';
import {
  EQueueContext,
  ITrack,
} from '../../services/music-player-service/music-player-service.schema';

@Component({
  selector: 'app-track-cards-grid',
  templateUrl: './track-cards-grid.html',
  styleUrl: './track-cards-grid.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Button, Tag, NgStyle, ImageFallbackDirective],
})
export class TrackCardsGridComponent {
  private readonly _player = inject(MusicPlayerService);

  readonly tracks = input.required<ITrack[]>();
  readonly tagLabel = input.required<string>();
  readonly sectionTitle = input.required<string>();
  readonly queueContext = input.required<EQueueContext>();

  protected playTrack(track: ITrack): void {
    this._player.playTrackInContext(
      track,
      this.tracks(),
      this.queueContext(),
    );
  }

  protected toggleTrack(track: ITrack): void {
    if (this.isCurrentTrack(track)) {
      this._player.togglePlayPause();
      return;
    }

    this.playTrack(track);
  }

  protected isCurrentTrack(track: ITrack): boolean {
    return this._player.currentTrack().id === track.id;
  }

  protected isPlayingTrack(track: ITrack): boolean {
    return this.isCurrentTrack(track) && this._player.isPlaying();
  }

  protected trackButtonIcon(track: ITrack): string {
    return this.isPlayingTrack(track) ? 'pi pi-pause' : 'pi pi-play';
  }
}
