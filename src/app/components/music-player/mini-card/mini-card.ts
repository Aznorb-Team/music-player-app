import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Card } from 'primeng/card';
import { Fieldset } from 'primeng/fieldset';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { Tag } from 'primeng/tag';
import { MusicPlayerService } from '../../../services/music-player-service/music-player-service';
import { ImageFallbackDirective } from '../../../core/directives/image-fallback.directive';

@Component({
  selector: 'mini-card',
  templateUrl: './mini-card.html',
  styleUrls: ['./mini-card.less'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, ScrollPanelModule, Fieldset, Tag, ImageFallbackDirective],
})
export class MiniCardComponent {
  protected readonly playerService = inject(MusicPlayerService);

  protected get lyrics(): string {
    return (
      this.playerService.currentTrack().lyrics ??
      'Текст песни для этого трека пока недоступен.'
    );
  }
}
