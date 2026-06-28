import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Card } from 'primeng/card';
import { Fieldset } from 'primeng/fieldset';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { MusicPlayerService } from '../../../services/music-player-service/music-player-service';
import { ContentService } from '../../../services/content-service/content-service';

@Component({
  selector: 'mini-card',
  templateUrl: './mini-card.html',
  styleUrls: ['./mini-card.less'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, ScrollPanelModule, Fieldset, Tag],
})
export class MiniCardComponent {
  protected readonly playerService = inject(MusicPlayerService);
  private readonly _contentService = inject(ContentService);

  protected get lyrics(): string {
    return (
      this.playerService.currentTrack().lyrics ??
      'Текст песни для этого трека пока недоступен.'
    );
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;

    if (img.src.includes(this._contentService.getImageFallback())) {
      return;
    }

    img.src = this._contentService.getImageFallback();
  }
}
