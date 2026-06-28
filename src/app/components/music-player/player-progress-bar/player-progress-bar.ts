import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  output,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TimePipe } from '../../../core/pipes/time.pipe';

@Component({
  selector: 'player-progress-bar',
  templateUrl: './player-progress-bar.html',
  styleUrl: './player-progress-bar.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TimePipe],
})
export class PlayerProgressBarComponent implements AfterViewInit, OnDestroy {
  private readonly _platformId = inject(PLATFORM_ID);

  readonly progress = input(0);
  readonly duration = input(0);
  readonly peaks = input<number[]>([]);

  readonly seekStart = output<void>();
  readonly seekEnd = output<number>();

  private readonly _waveformBaseRef =
    viewChild<ElementRef<HTMLCanvasElement>>('waveformBase');
  private readonly _waveformPlayedRef =
    viewChild<ElementRef<HTMLCanvasElement>>('waveformPlayed');
  private readonly _trackRef = viewChild<ElementRef<HTMLElement>>('track');

  protected readonly previewVisible = signal(false);
  protected readonly previewPercent = signal(0);
  protected readonly previewTime = signal(0);

  private _resizeObserver: ResizeObserver | null = null;
  private _isDragging = false;
  private _activePointerId: number | null = null;

  constructor() {
    effect(() => {
      this.peaks();
      this._drawWaveforms();
    });
  }

  public ngAfterViewInit(): void {
    if (!isPlatformBrowser(this._platformId)) {
      return;
    }

    const track = this._trackRef()?.nativeElement;

    if (!track) {
      return;
    }

    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this._drawWaveforms());
      this._resizeObserver.observe(track);
    }

    this._drawWaveforms();
  }

  public ngOnDestroy(): void {
    this._resizeObserver?.disconnect();
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    const track = this._trackRef()?.nativeElement;

    if (!track) {
      return;
    }

    event.preventDefault();
    track.setPointerCapture(event.pointerId);
    this._isDragging = true;
    this._activePointerId = event.pointerId;
    this.seekStart.emit();
    this._updatePreview(event.clientX);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this._isDragging || event.pointerId !== this._activePointerId) {
      return;
    }

    this._updatePreview(event.clientX);
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this._isDragging || event.pointerId !== this._activePointerId) {
      return;
    }

    this._finishPointerInteraction(event.clientX, event.pointerId);
  }

  protected onPointerCancel(): void {
    this._resetPointerState();
    this.hidePreview();
  }

  protected onPointerLeave(event: PointerEvent): void {
    if (!this._isDragging) {
      this.hidePreview();
    }
  }

  private _finishPointerInteraction(clientX: number, pointerId: number): void {
    const track = this._trackRef()?.nativeElement;
    const percent = this._percentFromClientX(clientX);

    if (track?.hasPointerCapture(pointerId)) {
      track.releasePointerCapture(pointerId);
    }

    this._resetPointerState();
    this.seekEnd.emit(percent);
    this.hidePreview();
  }

  private _resetPointerState(): void {
    this._isDragging = false;
    this._activePointerId = null;
  }

  private _updatePreview(clientX: number): void {
    const value = this._percentFromClientX(clientX);
    this.previewPercent.set(value);
    this.previewTime.set((value / 100) * this.duration());
    this.previewVisible.set(true);
  }

  protected hidePreview(): void {
    if (!this._isDragging) {
      this.previewVisible.set(false);
    }
  }

  private _percentFromClientX(clientX: number): number {
    const track = this._trackRef()?.nativeElement;

    if (!track) {
      return 0;
    }

    const rect = track.getBoundingClientRect();

    if (!rect.width) {
      return 0;
    }

    const ratio = (clientX - rect.left) / rect.width;
    return Math.min(100, Math.max(0, ratio * 100));
  }

  private _drawWaveforms(): void {
    if (!isPlatformBrowser(this._platformId)) {
      return;
    }

    const baseCanvas = this._waveformBaseRef()?.nativeElement;
    const playedCanvas = this._waveformPlayedRef()?.nativeElement;
    const track = this._trackRef()?.nativeElement;

    if (!baseCanvas || !playedCanvas || !track) {
      return;
    }

    const width = track.clientWidth;
    const height = track.clientHeight;

    if (!width || !height) {
      return;
    }

    const styles = getComputedStyle(document.documentElement);
    const playedColor =
      styles.getPropertyValue('--p-button-outlined-warn-color').trim() ||
      '#f59e0b';
    const unplayedColor =
      styles.getPropertyValue('--p-text-muted-color').trim() || '#94a3b8';

    this._drawWaveformLayer(baseCanvas, width, height, unplayedColor, 0.55);
    this._drawWaveformLayer(playedCanvas, width, height, playedColor, 1);
  }

  private _drawWaveformLayer(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    color: string,
    alpha: number,
  ): void {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const peaks = this.peaks();

    if (!peaks.length) {
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(0, height / 2 - 1, width, 2);
      ctx.globalAlpha = 1;
      return;
    }

    const barWidth = width / peaks.length;
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;

    peaks.forEach((peak, index) => {
      const x = index * barWidth;
      const barHeight = Math.max(2, peak * (height - 4));
      const centerY = height / 2;

      ctx.fillRect(
        x + 0.5,
        centerY - barHeight / 2,
        Math.max(1, barWidth - 1),
        barHeight,
      );
    });

    ctx.globalAlpha = 1;
  }
}
