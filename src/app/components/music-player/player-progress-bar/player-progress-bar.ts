import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { TimePipe } from '../../../core/pipes/time.pipe';

@Component({
  selector: 'player-progress-bar',
  templateUrl: './player-progress-bar.html',
  styleUrl: './player-progress-bar.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TimePipe],
})
export class PlayerProgressBarComponent {
  readonly progress = input(0);
  readonly duration = input(0);

  readonly seekStart = output<void>();
  readonly seekEnd = output<number>();

  protected readonly previewVisible = signal(false);
  protected readonly previewPercent = signal(0);
  protected readonly previewTime = signal(0);

  protected onTrackClick(event: MouseEvent): void {
    const value = this._percentFromEvent(event);
    this.seekEnd.emit(value);
  }

  protected onTrackMove(event: MouseEvent): void {
    const value = this._percentFromEvent(event);
    this.previewPercent.set(value);
    this.previewTime.set((value / 100) * this.duration());
    this.previewVisible.set(true);
  }

  protected hidePreview(): void {
    this.previewVisible.set(false);
  }

  protected onDragStart(event: MouseEvent): void {
    this.seekStart.emit();
    this.onTrackMove(event);

    const onMove = (moveEvent: MouseEvent) => this.onTrackMove(moveEvent);
    const onUp = (upEvent: MouseEvent) => {
      const value = this._percentFromEvent(upEvent);
      this.seekEnd.emit(value);
      this.hidePreview();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  private _percentFromEvent(event: MouseEvent): number {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    return Math.min(100, Math.max(0, ratio * 100));
  }
}
