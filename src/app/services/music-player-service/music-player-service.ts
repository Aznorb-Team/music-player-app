import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { isPlatformBrowser } from '@angular/common';

import { CacheService } from '../cache-service/cache-service';

import {

  ETypeActionCache,

  ETypeCache,

  ICacheItem,

} from '../cache-service/cache-service.schema';

import { ECacheItemName } from '../../app.consts';

import { DEFAULT_PLAYLIST } from './music-player-service.const';
import { ARTIST_GENRE_MAP } from '../../components/genres/genres.const';

import { ERepeatMode, EQueueContext, ITrack, QUEUE_CONTEXT_LABELS } from './music-player-service.schema';
import { SearchFilterService } from '../search-filter-service/search-filter-service';
import { NotificationService } from '../notification-service/notification-service';
import {
  ESeverityNotification,
  ESummaryNotification,
} from '../notification-service/notification-service.const';



const PREVIOUS_TRACK_THRESHOLD_SEC = 3;



@Injectable({

  providedIn: 'root',

})

export class MusicPlayerService {

  private readonly _cacheService = inject(CacheService);
  private readonly _searchFilter = inject(SearchFilterService);
  private readonly _notificationService = inject(NotificationService);
  private readonly _platformId = inject(PLATFORM_ID);



  readonly playlist = signal<ITrack[]>(DEFAULT_PLAYLIST);

  readonly currentIndex = signal(0);

  readonly currentTrack = signal<ITrack>(DEFAULT_PLAYLIST[0]);

  readonly isPlaying = signal(false);

  readonly currentTime = signal(0);

  readonly duration = signal(0);

  readonly volume = signal(100);

  readonly isDragging = signal(false);

  readonly shuffle = signal(false);

  readonly repeatMode = signal(ERepeatMode.OFF);

  readonly queuePosition = signal(0);
  readonly queueContext = signal<EQueueContext>(EQueueContext.FULL);

  readonly queueContextLabel = computed(
    () => QUEUE_CONTEXT_LABELS[this.queueContext()],
  );

  readonly queuedTracks = computed(() => {

    const order = this._playOrder();

    const tracks = this.playlist();

    const position = this.queuePosition();



    return order.slice(position).map((index) => tracks[index]);

  });

  readonly filteredPlaylist = computed(() => {
    const tracks = this.playlist();

    if (!this._searchFilter.hasActiveSearch()) {
      return tracks;
    }

    return tracks.filter((track) =>
      this._searchFilter.matches(
        track.title,
        track.artist,
        track.album,
        track.lyrics,
      ),
    );
  });



  private readonly _playOrder = signal<number[]>(
    this._buildSequentialOrder(DEFAULT_PLAYLIST.length),
  );

  private readonly _queueContextTracks = signal<ITrack[]>(DEFAULT_PLAYLIST);



  private _audio: HTMLAudioElement | null = null;
  private _audioWithListeners: HTMLAudioElement | null = null;
  private _loadToken = 0;
  private _preferencesLoaded = false;
  private _volumeBeforeMute = 100;
  private _mediaSessionReady = false;

  public registerAudioElement(audio: HTMLAudioElement): void {
    if (!this._isBrowser) {
      return;
    }

    if (this._audio === audio) {
      return;
    }

    this._audio = audio;
    this._attachAudioListeners();
    this._setupMediaSession();
    this._loadVolumeFromCache();
    this._loadPlaybackPreferences();
    void this._applyTrackSource(false);
  }



  public play(): void {

    if (!this._audio || !this._isBrowser) {

      return;

    }



    void this._safePlay();

  }



  public pause(): void {

    if (!this._audio) {

      return;

    }



    this._audio.pause();

    this.isPlaying.set(false);
    this._updateMediaSessionPlaybackState();

  }



  public togglePlayPause(): void {

    if (this.isPlaying()) {

      this.pause();

    } else {

      this.play();

    }

  }



  public next(): void {

    this._advanceTrack(false);

  }



  public previous(): void {

    if (

      this._audio &&

      this._audio.currentTime > PREVIOUS_TRACK_THRESHOLD_SEC &&

      this.repeatMode() !== ERepeatMode.ONE

    ) {

      this.reset();

      return;

    }



    const order = this._playOrder();

    const position = this.queuePosition();



    if (position > 0) {

      this._goToQueuePosition(position - 1, true);

      return;

    }



    if (this.repeatMode() === ERepeatMode.ALL && order.length > 1) {

      this._goToQueuePosition(order.length - 1, true);

      return;

    }



    this.reset();

  }



  public reset(): void {

    if (!this._audio) {

      return;

    }



    this._audio.currentTime = 0;

    void this._safePlay();

  }



  public seek(progress: number): void {

    if (!this._audio || !this._audio.duration) {

      return;

    }



    this._audio.currentTime = (progress / 100) * this._audio.duration;

    this.isDragging.set(false);

  }



  public startDragging(): void {

    this.isDragging.set(true);

  }



  public setVolume(value: number): void {

    const volume = Math.min(100, Math.max(0, value));

    this.volume.set(volume);



    if (this._audio) {

      this._audio.volume = volume / 100;

    }



    const volumeItem: ICacheItem = {

      name: ECacheItemName.VOLUME,

      value: volume.toString(),

    };



    this._cacheService.useCacheService(

      volumeItem,

      ETypeCache.LOCAL,

      ETypeActionCache.SAVE,

    );

  }



  public toggleShuffle(): void {
    const enabled = !this.shuffle();
    this.shuffle.set(enabled);

    const indices = this._tracksToIndices(this._queueContextTracks());

    if (enabled) {
      this._playOrder.set(
        this._buildShuffledOrderFromIndices(indices, this.currentIndex()),
      );
    } else {
      this._playOrder.set(indices);
    }

    this._syncQueuePositionToCurrentIndex();
    this._persistPlaybackPreferences();
  }



  public cycleRepeatMode(): void {

    const modes = [ERepeatMode.OFF, ERepeatMode.ALL, ERepeatMode.ONE];

    const nextMode = modes[(modes.indexOf(this.repeatMode()) + 1) % modes.length];



    this.setRepeatMode(nextMode);

  }



  public setRepeatMode(mode: ERepeatMode): void {

    this.repeatMode.set(mode);

    this._persistPlaybackPreferences();

  }



  public loadTrack(index: number): void {

    this._selectTrack(index, false);

  }



  public playTrack(track: ITrack): void {
    this.playTrackInContext(track, this.playlist(), EQueueContext.FULL);
  }

  public playTrackInContext(
    track: ITrack,
    contextTracks: ITrack[],
    context: EQueueContext,
  ): void {
    const index = this.playlist().findIndex((item) => item.id === track.id);

    if (index === -1) {
      return;
    }

    this._setQueueFromTracks(contextTracks, track, context);

    if (this.currentIndex() === index) {
      if (!this.isPlaying()) {
        void this._safePlay();
      }

      return;
    }

    this._selectTrack(index, true, false);
  }

  public playByArtist(artist: string): void {
    const artistTracks = this.playlist().filter((item) => item.artist === artist);
    const track = artistTracks[0];

    if (track) {
      this.playTrackInContext(track, artistTracks, EQueueContext.ARTIST);
    }
  }

  public playByGenre(genreId: string): void {
    const genreTracks = this.playlist().filter((item) =>
      ARTIST_GENRE_MAP[item.artist]?.includes(genreId),
    );
    const track = genreTracks[0];

    if (track) {
      this.playTrackInContext(track, genreTracks, EQueueContext.GENRE);
    }
  }

  public seekBySeconds(delta: number): void {
    if (!this._audio) {
      return;
    }

    const duration = this._audio.duration || 0;
    const next = Math.min(duration, Math.max(0, this._audio.currentTime + delta));
    this._audio.currentTime = next;
    this.currentTime.set(next);
  }

  public adjustVolume(delta: number): void {
    this.setVolume(this.volume() + delta);
  }

  public toggleMute(): void {
    if (this.volume() === 0) {
      this.setVolume(this._volumeBeforeMute || 50);
      return;
    }

    this._volumeBeforeMute = this.volume();
    this.setVolume(0);
  }



  public playFromQueueOffset(offset: number): void {
    if (offset === 0) {
      return;
    }

    const position = this.queuePosition() + offset;

    const order = this._playOrder();



    if (position < 0 || position >= order.length) {

      return;

    }



    this._goToQueuePosition(position, true);

  }



  private _goToQueuePosition(position: number, shouldPlay: boolean): void {

    const order = this._playOrder();



    if (position < 0 || position >= order.length) {

      return;

    }



    this.queuePosition.set(position);

    this._selectTrack(order[position], shouldPlay, false);

  }



  private _selectTrack(

    index: number,

    shouldPlay: boolean,

    syncQueuePosition = true,

  ): void {

    const tracks = this.playlist();

    if (index < 0 || index >= tracks.length) {

      return;

    }



    if (syncQueuePosition) {

      const orderPosition = this._playOrder().indexOf(index);

      if (orderPosition >= 0) {

        this.queuePosition.set(orderPosition);

      }

    }



    this.currentIndex.set(index);

    this.currentTrack.set(tracks[index]);

    this._updateMediaSessionMetadata();
    void this._applyTrackSource(shouldPlay);

  }



  private _advanceTrack(fromTrackEnd: boolean): void {

    if (this.repeatMode() === ERepeatMode.ONE) {

      this.reset();

      return;

    }



    const order = this._playOrder();

    const position = this.queuePosition();



    if (position < order.length - 1) {

      this._goToQueuePosition(position + 1, true);

      return;

    }



    if (this.repeatMode() === ERepeatMode.ALL) {

      this._goToQueuePosition(0, true);

      return;

    }



    this.isPlaying.set(false);

    this.isDragging.set(false);



    if (fromTrackEnd) {

      this.currentTime.set(0);

    }

  }



  private async _applyTrackSource(shouldPlay: boolean): Promise<void> {

    if (!this._audio || !this._isBrowser) {

      return;

    }



    const token = ++this._loadToken;

    const track = this.currentTrack();



    this._audio.pause();

    this.isPlaying.set(false);

    this.currentTime.set(0);

    this.duration.set(0);



    this._audio.src = track.src;

    this._audio.load();



    if (!shouldPlay) {

      return;

    }



    try {

      await this._waitForCanPlay(token);

      if (token !== this._loadToken) {

        return;

      }



      await this._safePlay();

    } catch {

      if (token === this._loadToken) {

        this.isPlaying.set(false);
        this._updateMediaSessionPlaybackState();

        this._notifyAudioError(track);

      }

    }

  }



  private _notifyAudioError(track: ITrack): void {

    this._notificationService.showNotification({

      severity: ESeverityNotification.ERROR,

      summary: ESummaryNotification.ERROR,

      detail: `Не удалось воспроизвести «${track.title}». Файл недоступен.`,

    });

  }



  private _waitForCanPlay(token: number): Promise<void> {

    return new Promise((resolve, reject) => {

      if (!this._audio || token !== this._loadToken) {

        resolve();

        return;

      }



      if (this._audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {

        resolve();

        return;

      }



      const onCanPlay = () => {

        cleanup();

        resolve();

      };



      const onError = () => {

        cleanup();

        reject(new Error('Audio load failed'));

      };



      const cleanup = () => {

        this._audio?.removeEventListener('canplay', onCanPlay);

        this._audio?.removeEventListener('error', onError);

      };



      this._audio.addEventListener('canplay', onCanPlay);

      this._audio.addEventListener('error', onError);

    });

  }



  private async _safePlay(): Promise<void> {

    if (!this._audio) {

      return;

    }



    try {

      await this._audio.play();

      this.isPlaying.set(true);
      this._updateMediaSessionPlaybackState();

    } catch {

      this.isPlaying.set(false);
      this._updateMediaSessionPlaybackState();

      if (this._audio.error) {

        this._notifyAudioError(this.currentTrack());

      }

    }

  }



  private get _isBrowser(): boolean {

    return isPlatformBrowser(this._platformId);

  }



  private _attachAudioListeners(): void {
    if (!this._audio || this._audioWithListeners === this._audio) {
      return;
    }

    this._audioWithListeners = this._audio;

    this._audio.addEventListener('ended', () => {

      this._advanceTrack(true);

    });



    this._audio.addEventListener('timeupdate', () => {

      if (!this._audio || this.isDragging()) {

        return;

      }



      this.currentTime.set(this._audio.currentTime);



      if (this._audio.duration) {

        this.duration.set(this._audio.duration);

      }

    });



    this._audio.addEventListener('loadedmetadata', () => {

      if (this._audio) {

        this.duration.set(this._audio.duration);

      }

    });

  }



  private _loadVolumeFromCache(): void {

    const volumeItem: ICacheItem = {

      name: ECacheItemName.VOLUME,

    };



    const cached = this._cacheService.useCacheService(

      volumeItem,

      ETypeCache.LOCAL,

      ETypeActionCache.LOAD,

    );



    if (cached) {

      this.setVolume(Number(JSON.parse(cached)) || 100);

    }

  }



  private _loadPlaybackPreferences(): void {

    if (this._preferencesLoaded) {

      return;

    }



    this._preferencesLoaded = true;



    const shuffleItem: ICacheItem = { name: ECacheItemName.SHUFFLE };

    const cachedShuffle = this._cacheService.useCacheService(

      shuffleItem,

      ETypeCache.LOCAL,

      ETypeActionCache.LOAD,

    );



    if (cachedShuffle) {

      const enabled = JSON.parse(cachedShuffle) === true;

      this.shuffle.set(enabled);



      if (enabled) {
        const indices = this._tracksToIndices(this._queueContextTracks());
        this._playOrder.set(
          this._buildShuffledOrderFromIndices(indices, this.currentIndex()),
        );
        this._syncQueuePositionToCurrentIndex();
      }

    }



    const repeatItem: ICacheItem = { name: ECacheItemName.REPEAT_MODE };

    const cachedRepeat = this._cacheService.useCacheService(

      repeatItem,

      ETypeCache.LOCAL,

      ETypeActionCache.LOAD,

    );



    if (

      cachedRepeat &&

      Object.values(ERepeatMode).includes(cachedRepeat as ERepeatMode)

    ) {

      this.repeatMode.set(cachedRepeat as ERepeatMode);

    }

  }



  private _persistPlaybackPreferences(): void {

    const shuffleItem: ICacheItem = {

      name: ECacheItemName.SHUFFLE,

      value: JSON.stringify(this.shuffle()),

    };



    this._cacheService.useCacheService(

      shuffleItem,

      ETypeCache.LOCAL,

      ETypeActionCache.SAVE,

    );



    const repeatItem: ICacheItem = {

      name: ECacheItemName.REPEAT_MODE,

      value: this.repeatMode(),

    };



    this._cacheService.useCacheService(

      repeatItem,

      ETypeCache.LOCAL,

      ETypeActionCache.SAVE,

    );

  }



  private _setQueueFromTracks(
    contextTracks: ITrack[],
    startTrack: ITrack,
    context: EQueueContext,
  ): void {
    const indices = this._tracksToIndices(contextTracks);
    const startIndex = this.playlist().findIndex((item) => item.id === startTrack.id);

    if (!indices.length || startIndex === -1) {
      return;
    }

    this._queueContextTracks.set(contextTracks);
    this.queueContext.set(context);

    if (this.shuffle()) {
      this._playOrder.set(
        this._buildShuffledOrderFromIndices(indices, startIndex),
      );
    } else {
      this._playOrder.set(indices);
    }

    const queuePos = this._playOrder().indexOf(startIndex);

    if (queuePos >= 0) {
      this.queuePosition.set(queuePos);
    }
  }

  private _tracksToIndices(tracks: ITrack[]): number[] {
    const seen = new Set<number>();

    return tracks
      .map((track) => this.playlist().findIndex((item) => item.id === track.id))
      .filter((index) => {
        if (index < 0 || seen.has(index)) {
          return false;
        }

        seen.add(index);
        return true;
      });
  }

  private _buildShuffledOrderFromIndices(
    indices: number[],
    currentIndex: number,
  ): number[] {
    const shuffled = [...indices];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const currentPosition = shuffled.indexOf(currentIndex);

    if (currentPosition > 0) {
      shuffled.splice(currentPosition, 1);
      shuffled.unshift(currentIndex);
    }

    return shuffled;
  }

  private _syncQueuePositionToCurrentIndex(): void {

    const orderPosition = this._playOrder().indexOf(this.currentIndex());

    if (orderPosition >= 0) {

      this.queuePosition.set(orderPosition);

    }

  }



  private _buildSequentialOrder(length: number): number[] {

    return Array.from({ length }, (_, index) => index);

  }

  private _setupMediaSession(): void {
    if (
      !this._isBrowser ||
      this._mediaSessionReady ||
      !('mediaSession' in navigator)
    ) {
      return;
    }

    this._mediaSessionReady = true;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        void this._safePlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        this.pause();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        this.previous();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        this.next();
      });
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        this.seekBySeconds(-10);
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        this.seekBySeconds(10);
      });
    } catch {
      return;
    }

    this._updateMediaSessionMetadata();
    this._updateMediaSessionPlaybackState();
  }

  private _updateMediaSessionMetadata(): void {
    if (!this._isBrowser || !('mediaSession' in navigator)) {
      return;
    }

    const track = this.currentTrack();

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album ?? '',
      artwork: [
        {
          src: track.coverUrl,
          sizes: '512x512',
          type: 'image/jpeg',
        },
      ],
    });
  }

  private _updateMediaSessionPlaybackState(): void {
    if (!this._isBrowser || !('mediaSession' in navigator)) {
      return;
    }

    navigator.mediaSession.playbackState = this.isPlaying()
      ? 'playing'
      : 'paused';
  }

}

