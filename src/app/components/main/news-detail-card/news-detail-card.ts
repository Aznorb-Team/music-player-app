import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Card } from 'primeng/card';
import { Fieldset } from 'primeng/fieldset';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { Tag } from 'primeng/tag';
import { DatePipe } from '@angular/common';
import { ContentService } from '../../../services/content-service/content-service';

@Component({
  selector: 'news-detail-card',
  templateUrl: './news-detail-card.html',
  styleUrls: ['./news-detail-card.less'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, ScrollPanelModule, Fieldset, Tag, DatePipe],
})
export class NewsDetailCardComponent {
  protected readonly contentService = inject(ContentService);

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;

    if (img.src.includes(this.contentService.getImageFallback())) {
      return;
    }

    img.src = this.contentService.getImageFallback();
  }
}
