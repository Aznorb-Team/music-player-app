import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { Toolbar } from 'primeng/toolbar';
import { Avatar } from 'primeng/avatar';
import { Button } from 'primeng/button';
import { Slider } from 'primeng/slider';
import { Popover } from 'primeng/popover';
import { NotificationService } from '../../services/notification-service/notification-service';
import {
  ESeverityNotification,
  ESummuryNotification,
} from '../../services/notification-service/notification-service.const';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TimePipe } from '../../core/pipes/time.pipe';
import { MiniCardComponent } from './mini-card/mini-card';

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
export class MusicPlayerComponent implements OnInit {
  private readonly _dr = inject(DestroyRef);
  private readonly _notificationService = inject(NotificationService);

  protected isPlay = signal<boolean>(false);
  protected isDragging = signal<boolean>(false);

  protected volumeForm = new FormControl<number>(100);
  protected musicProgressBar = new FormControl<number>(0);

  @ViewChild('audioPlayer') myAudioRef!: ElementRef<HTMLAudioElement>;

  // protected startTime = computed(
  //   () => this.myAudioRef?.nativeElement?.currentTime || 0,
  // );
  //
  // protected endTime = computed(
  //   () => this.myAudioRef?.nativeElement?.duration || 0,
  // );
  protected get startTime(): number {
    return this.myAudioRef?.nativeElement?.currentTime || 0;
  }

  protected get endTime(): number {
    return this.myAudioRef?.nativeElement?.duration || 0;
  }

  public ngOnInit(): void {
    this._subscribeOnChangeVolume();
  }

  protected clickOnPlayPause(): void {
    if (this.isPlay()) {
      this._pause();
    } else {
      this._play();
    }
  }

  protected onReset(): void {
    this.myAudioRef.nativeElement.currentTime = 0;
    this._play();
  }

  private _play(): void {
    this.myAudioRef.nativeElement.play().then((result) => {
      this._notificationService.showNotification({
        severity: ESeverityNotification.INFO,
        summary: ESummuryNotification.INFO,
        detail: 'Music Play!',
      });
    });

    this.myAudioRef.nativeElement.addEventListener('load', this._onLoad);
    this.myAudioRef.nativeElement.addEventListener('playing', this._onPlaying);
    this.myAudioRef.nativeElement.addEventListener('ended', this._onEnded);
    this.myAudioRef.nativeElement.addEventListener(
      'timeupdate',
      this._onTimeUpdate,
    );

    this.isPlay.set(true);
  }

  private _onLoad = () => {
    console.log('Load');
  };

  private _onPlaying = () => {
    console.log('Playing');
  };

  private _onEnded = () => {
    this.isPlay.set(false);
    this.isDragging.set(false);
  };

  private _onTimeUpdate = () => {
    if (!this.isDragging()) {
      this.musicProgressBar.setValue(this._getProgressBarValue());
    }
  };

  private _getProgressBarValue(): number {
    const duration = this.myAudioRef.nativeElement.duration;
    const currentTime = this.myAudioRef.nativeElement.currentTime;

    return (currentTime * 100) / duration;
  }

  protected seekAudio(progress: number) {
    this.myAudioRef.nativeElement.currentTime =
      (progress / 100) * this.myAudioRef.nativeElement.duration;
    this.isDragging.set(false);
  }

  protected isDrag(): void {
    if (!this.isDragging()) {
      this.isDragging.set(true);
    }
  }

  private _pause(): void {
    this.myAudioRef.nativeElement.pause();
    this.isPlay.set(false);
  }

  private _subscribeOnChangeVolume(): void {
    this.volumeForm.valueChanges
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe((value) => {
        if (value) {
          this.myAudioRef.nativeElement.volume = value / 100;
        } else {
          this.myAudioRef.nativeElement.volume = 0;
        }
      });
  }
}
