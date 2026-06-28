import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Card } from 'primeng/card';
import { Fieldset } from 'primeng/fieldset';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { Tag } from 'primeng/tag';
import { DatePipe } from '@angular/common';
import { ContentService } from '../../../services/content-service/content-service';
import { ImageFallbackDirective } from '../../../core/directives/image-fallback.directive';

@Component({
  selector: 'news-detail-card',
  templateUrl: './news-detail-card.html',
  styleUrls: ['./news-detail-card.less'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, ScrollPanelModule, Fieldset, Tag, DatePipe, ImageFallbackDirective],
})
export class NewsDetailCardComponent {
  protected readonly contentService = inject(ContentService);
}
