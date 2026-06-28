import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
  ViewChild,
} from '@angular/core';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Carousel } from 'primeng/carousel';
import { Tag } from 'primeng/tag';
import { Popover } from 'primeng/popover';
import { DatePipe, NgStyle } from '@angular/common';
import { ContentService } from '../../services/content-service/content-service';
import {
  EConcertStatus,
  INewsItem,
} from '../../services/content-service/content-service.schema';
import { MusicPlayerService } from '../../services/music-player-service/music-player-service';
import { NewsDetailCardComponent } from './news-detail-card/news-detail-card';
import { ImageFallbackDirective } from '../../core/directives/image-fallback.directive';

@Component({
  selector: 'main',
  templateUrl: 'main.html',
  styleUrls: ['main.less'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Select,
    FormsModule,
    Card,
    Button,
    Carousel,
    Tag,
    Popover,
    NgStyle,
    DatePipe,
    NewsDetailCardComponent,
    ImageFallbackDirective,
  ],
})
export class MainComponent {
  private readonly _musicPlayerService = inject(MusicPlayerService);
  protected readonly contentService = inject(ContentService);

  protected readonly concertStatus = EConcertStatus;
  protected readonly selectedCity = model<string | undefined>(undefined);
  protected readonly selectedNewsCategory = model<string | undefined>(
    undefined,
  );
  protected readonly selectedConcertStatus = model<EConcertStatus | undefined>(
    undefined,
  );

  @ViewChild('newsDetailPopover')
  private _newsDetailPopover!: Popover;

  protected onCityChange(city: string | undefined): void {
    this.selectedCity.set(city);
    this.contentService.setSelectedCity(city);
  }

  protected onNewsCategoryChange(category: string | undefined): void {
    this.selectedNewsCategory.set(category);
    this.contentService.setSelectedNewsCategory(category);
  }

  protected onConcertStatusChange(status: EConcertStatus | undefined): void {
    this.selectedConcertStatus.set(status);
    this.contentService.setSelectedConcertStatus(status);
  }

  protected playArtistTrack(artist: string): void {
    this._musicPlayerService.playByArtist(artist);
  }

  protected playNewsTrack(news: INewsItem): void {
    if (news.artist) {
      this.playArtistTrack(news.artist);
    }
  }

  protected openNewsDetail(news: INewsItem, event: Event): void {
    this.contentService.openNewsDetail(news.id);
    this._newsDetailPopover.toggle(event);
  }
}
