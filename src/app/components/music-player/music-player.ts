import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Toolbar } from 'primeng/toolbar';
import { Avatar } from 'primeng/avatar';
import { Button } from 'primeng/button';
import { Slider } from 'primeng/slider';
import { Popover } from 'primeng/popover';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TimePipe } from '../../core/pipes/time.pipe';
import { MiniCardComponent } from './mini-card/mini-card';
import { MusicPlayerService } from '../../services/music-player-service/music-player-service';
import { ERepeatMode } from '../../services/music-player-service/music-player-service.schema';
import { FavoritesService } from '../../services/favorites-service/favorites-service';

@Component({
  selector: 'music-player',
  templateUrl: './music-player.html',
  styleUrls: ['./music-player.less'],
  standalone: true,
  imports: [
    Toolbar,
    Avatar,
    Button,
    Slider,
    Popover,
    FormsModule,
    ReactiveFormsModule,
    TimePipe,
    MiniCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusicPlayerComponent implements OnInit, AfterViewInit {
  private readonly _dr = inject(DestroyRef);
  protected readonly playerService = inject(MusicPlayerService);
  protected readonly favoritesService = inject(FavoritesService);
  protected readonly repeatMode = ERepeatMode;

  protected volumeForm = new FormControl<number>(100);
  protected musicProgressBar = new FormControl<number>(0);

  constructor() {
    effect(() => {
      if (this.playerService.isDragging()) {
        return;
      }

      const duration = this.playerService.duration();
      const currentTime = this.playerService.currentTime();
      const progress = duration ? (currentTime * 100) / duration : 0;
      this.musicProgressBar.setValue(progress, { emitEvent: false });
    });
  }

  @ViewChild('audioPlayer', { static: true })
  private _audioPlayerRef?: ElementRef<HTMLAudioElement>;

  public ngOnInit(): void {
    this.favoritesService.ensureLoaded();
    this._subscribeOnChangeVolume();
  }

  public ngAfterViewInit(): void {
    if (this._audioPlayerRef) {
      this.playerService.registerAudioElement(
        this._audioPlayerRef.nativeElement,
      );
      this.volumeForm.setValue(this.playerService.volume(), {
        emitEvent: false,
      });
    }
  }

  protected clickOnPlayPause(): void {
    this.playerService.togglePlayPause();
  }

  protected onReset(): void {
    this.playerService.reset();
  }

  protected seekAudio(progress: number): void {
    this.playerService.seek(progress);
  }

  protected isDrag(): void {
    this.playerService.startDragging();
  }

  protected repeatIcon(): string {
    return this.playerService.repeatMode() === ERepeatMode.ONE
      ? 'pi pi-replay'
      : 'pi pi-sync';
  }

  protected isRepeatActive(): boolean {
    return this.playerService.repeatMode() !== ERepeatMode.OFF;
  }

  protected repeatTooltip(): string {
    switch (this.playerService.repeatMode()) {
      case ERepeatMode.ONE:
        return 'Повтор трека';
      case ERepeatMode.ALL:
        return 'Повтор плейлиста';
      default:
        return 'Повтор выключен';
    }
  }

  protected toggleFavorite(): void {
    this.favoritesService.toggleFavorite(this.playerService.currentTrack());
  }

  protected isCurrentTrackFavorite(): boolean {
    return this.favoritesService.isFavorite(this.playerService.currentTrack().id);
  }

  private _subscribeOnChangeVolume(): void {
    this.volumeForm.valueChanges
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe((value) => {
        this.playerService.setVolume(value ?? 0);
      });
  }
}
