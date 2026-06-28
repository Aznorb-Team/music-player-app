import { inject, Injectable, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MusicPlayerService } from '../music-player-service/music-player-service';

const SEEK_STEP_SEC = 5;

@Injectable({
  providedIn: 'root',
})
export class PlayerHotkeysService implements OnDestroy {
  private readonly _player = inject(MusicPlayerService);
  private readonly _platformId = inject(PLATFORM_ID);

  private _boundHandler = (event: KeyboardEvent) => this._onKeyDown(event);
  private _active = false;

  public enable(): void {
    if (!this._isBrowser || this._active) {
      return;
    }

    document.addEventListener('keydown', this._boundHandler);
    this._active = true;
  }

  public disable(): void {
    if (!this._active) {
      return;
    }

    document.removeEventListener('keydown', this._boundHandler);
    this._active = false;
  }

  public ngOnDestroy(): void {
    this.disable();
  }

  private _onKeyDown(event: KeyboardEvent): void {
    if (this._isTypingTarget(event.target)) {
      return;
    }

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this._player.togglePlayPause();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (event.shiftKey) {
          this._player.previous();
        } else {
          this._player.seekBySeconds(-SEEK_STEP_SEC);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (event.shiftKey) {
          this._player.next();
        } else {
          this._player.seekBySeconds(SEEK_STEP_SEC);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        this._player.adjustVolume(5);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this._player.adjustVolume(-5);
        break;
      case 'KeyM':
        event.preventDefault();
        this._player.toggleMute();
        break;
      case 'KeyS':
        event.preventDefault();
        this._player.toggleShuffle();
        break;
      case 'KeyR':
        event.preventDefault();
        this._player.cycleRepeatMode();
        break;
      default:
        break;
    }
  }

  private _isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    const tag = target.tagName.toLowerCase();
    return (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      target.isContentEditable
    );
  }

  private get _isBrowser(): boolean {
    return isPlatformBrowser(this._platformId);
  }
}
