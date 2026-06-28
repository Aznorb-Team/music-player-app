import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Toolbar } from 'primeng/toolbar';
import { Avatar } from 'primeng/avatar';
import { Button } from 'primeng/button';
import { Popover } from 'primeng/popover';
import { Slider } from 'primeng/slider';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TimePipe } from '../../core/pipes/time.pipe';
import { MiniCardComponent } from './mini-card/mini-card';
import { PlayerProgressBarComponent } from './player-progress-bar/player-progress-bar';
import { MusicPlayerService } from '../../services/music-player-service/music-player-service';
import { ERepeatMode } from '../../services/music-player-service/music-player-service.schema';
import { FavoritesService } from '../../services/favorites-service/favorites-service';
import { PlayerHotkeysService } from '../../services/player-hotkeys-service/player-hotkeys-service';

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
    PlayerProgressBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusicPlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly _dr = inject(DestroyRef);
  private readonly _hotkeys = inject(PlayerHotkeysService);
  protected readonly playerService = inject(MusicPlayerService);
  protected readonly favoritesService = inject(FavoritesService);
  protected readonly repeatMode = ERepeatMode;

  protected volumeForm = new FormControl<number>(100);

  protected readonly progressPercent = computed(() => {
    const duration = this.playerService.duration();
    if (!duration) {
      return 0;
    }

    return (this.playerService.currentTime() / duration) * 100;
  });

  constructor() {
    effect(() => {
      const volume = this.playerService.volume();
      if (this.volumeForm.value !== volume) {
        this.volumeForm.setValue(volume, { emitEvent: false });
      }
    });
  }

  @ViewChild('audioPlayer', { static: true })
  private _audioPlayerRef?: ElementRef<HTMLAudioElement>;

  public ngOnInit(): void {
    this.favoritesService.ensureLoaded();
    this._hotkeys.enable();
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

  public ngOnDestroy(): void {
    this._hotkeys.disable();
  }

  protected clickOnPlayPause(): void {
    this.playerService.togglePlayPause();
  }

  protected onReset(): void {
    this.playerService.reset();
  }

  protected onSeekStart(): void {
    this.playerService.startDragging();
  }

  protected onSeekEnd(progress: number): void {
    this.playerService.seek(progress);
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
