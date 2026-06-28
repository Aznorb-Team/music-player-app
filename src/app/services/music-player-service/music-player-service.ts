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
import {
  CROSSFADE_DURATION_DEFAULT_SEC,
  CROSSFADE_DURATION_MAX_SEC,
  CROSSFADE_DURATION_MIN_SEC,
  MIN_POSITION_TO_SAVE_SEC,
  POSITION_SAVE_END_THRESHOLD,
  POSITION_SAVE_INTERVAL_MS,
} from './music-player-playback.const';

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

  readonly isTrackLoading = signal(false);

  readonly shuffle = signal(false);

  readonly repeatMode = signal(ERepeatMode.OFF);

  readonly crossfadeEnabled = signal(true);

  readonly crossfadeDurationSec = signal(CROSSFADE_DURATION_DEFAULT_SEC);

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



  private _audioElements: [HTMLAudioElement, HTMLAudioElement] | null = null;
  private _activeSlot: 0 | 1 = 0;
  private readonly _audioWithListeners = new Set<HTMLAudioElement>();
  private _loadToken = 0;
  private _crossfadeFrameId: number | null = null;
  private _preferencesLoaded = false;
  private _volumeBeforeMute = 100;
  private _mediaSessionReady = false;
  private _positionsCache: Record<string, number> = {};
  private _lastPositionSaveAt = 0;
  private _pendingSeekTime: number | null = null;

  public registerAudioElements(
    primary: HTMLAudioElement,
    secondary: HTMLAudioElement,
  ): void {
    if (!this._isBrowser) {
      return;
    }

    if (
      this._audioElements?.[0] === primary &&
      this._audioElements?.[1] === secondary
    ) {
      return;
    }

    this._audioElements = [primary, secondary];
    this._attachAudioListeners(primary, 0);
    this._attachAudioListeners(secondary, 1);
    this._setupMediaSession();
    this._loadVolumeFromCache();
    this._loadPlaybackPreferences();
    this._loadPositionsFromCache();
    void this._restoreLastPlayback();
  }



  public play(): void {
    const audio = this._getActiveAudio();

    if (!audio || !this._isBrowser) {
      return;
    }

    void this._safePlay(audio);
  }

  public pause(): void {
    if (!this._audioElements) {
      return;
    }

    this._cancelCrossfade();
    this._audioElements[this._activeSlot].pause();
    this.isPlaying.set(false);
    this._persistCurrentPosition();
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
    const audio = this._getActiveAudio();

    if (
      audio &&
      audio.currentTime > PREVIOUS_TRACK_THRESHOLD_SEC &&
      this.repeatMode() !== ERepeatMode.ONE
    ) {
      this.reset();
      return;
    }



    const order = this._playOrder();

    const position = this.queuePosition();



    if (position > 0) {

      this._goToQueuePosition(position - 1, true, false);

      return;

    }



    if (this.repeatMode() === ERepeatMode.ALL && order.length > 1) {

      this._goToQueuePosition(order.length - 1, true, false);

      return;

    }



    this.reset();

  }



  public reset(): void {
    const audio = this._getActiveAudio();

    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    this.currentTime.set(0);
    this._clearSavedPosition(this.currentTrack().id);
    void this._safePlay(audio);
  }

  public seek(progress: number): void {
    const audio = this._getActiveAudio();

    if (!audio) {
      return;
    }

    const duration = audio.duration;

    if (!Number.isFinite(duration) || duration <= 0) {
      return;
    }

    this.duration.set(duration);
    this.isDragging.set(false);
    this._seekToTime(audio, (progress / 100) * duration);
  }



  public startDragging(): void {

    this.isDragging.set(true);

  }



  public setVolume(value: number): void {

    const volume = Math.min(100, Math.max(0, value));

    this.volume.set(volume);



    if (this._audioElements) {
      this._applyVolumeToSlot(this._activeSlot, 1);
      this._applyVolumeToSlot(this._activeSlot === 0 ? 1 : 0, 0);
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
        const audio = this._getActiveAudio();
        if (audio) {
          void this._safePlay(audio);
        }
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

  public setCrossfadeEnabled(enabled: boolean): void {
    this.crossfadeEnabled.set(enabled);
    this._persistCrossfadePreferences();
  }

  public setCrossfadeDurationSec(seconds: number): void {
    const value = Math.min(
      CROSSFADE_DURATION_MAX_SEC,
      Math.max(CROSSFADE_DURATION_MIN_SEC, Math.round(seconds)),
    );
    this.crossfadeDurationSec.set(value);
    this._persistCrossfadePreferences();
  }

  public seekBySeconds(delta: number): void {
    const audio = this._getActiveAudio();

    if (!audio) {
      return;
    }

    const duration = audio.duration || 0;

    if (!Number.isFinite(duration) || duration <= 0) {
      return;
    }

    const baseTime = this._pendingSeekTime ?? audio.currentTime;
    const next = Math.min(duration, Math.max(0, baseTime + delta));
    this._seekToTime(audio, next);
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



    this._goToQueuePosition(position, true, false);

  }



  private _goToQueuePosition(
    position: number,
    shouldPlay: boolean,
    allowCrossfade = false,
  ): void {

    const order = this._playOrder();



    if (position < 0 || position >= order.length) {

      return;

    }



    this.queuePosition.set(position);

    this._selectTrack(order[position], shouldPlay, false, allowCrossfade);

  }



  private _selectTrack(

    index: number,

    shouldPlay: boolean,

    syncQueuePosition = true,

    allowCrossfade = false,

    restorePosition = false,

  ): void {

    const tracks = this.playlist();

    if (index < 0 || index >= tracks.length) {

      return;

    }



    const previousIndex = this.currentIndex();

    const isSameTrack = index === previousIndex;

    if (syncQueuePosition) {

      const orderPosition = this._playOrder().indexOf(index);

      if (orderPosition >= 0) {

        this.queuePosition.set(orderPosition);

      }

    }



    this.currentIndex.set(index);

    this.currentTrack.set(tracks[index]);

    this._updateMediaSessionMetadata();

    if (!isSameTrack) {
      this.currentTime.set(0);
      this.duration.set(0);
    }

    const wasPlaying = this.isPlaying();
    const useCrossfade =
      allowCrossfade &&
      shouldPlay &&
      wasPlaying &&
      !isSameTrack &&
      this.crossfadeEnabled();

    void this._applyTrackSource(shouldPlay, {
      useCrossfade,
      restorePosition: restorePosition && !isSameTrack,
    });

  }



  private _advanceTrack(fromTrackEnd: boolean): void {

    if (this.repeatMode() === ERepeatMode.ONE) {

      this.reset();

      return;

    }



    const order = this._playOrder();

    const position = this.queuePosition();



    if (position < order.length - 1) {

      this._goToQueuePosition(position + 1, true, fromTrackEnd);

      return;

    }



    if (this.repeatMode() === ERepeatMode.ALL) {

      this._goToQueuePosition(0, true, fromTrackEnd);

      return;

    }



    this.isPlaying.set(false);

    this.isDragging.set(false);



    if (fromTrackEnd) {

      this.currentTime.set(0);

    }

  }



  private async _applyTrackSource(
    shouldPlay: boolean,
    options: { useCrossfade?: boolean; restorePosition?: boolean } = {},
  ): Promise<void> {
    if (!this._audioElements || !this._isBrowser) {
      return;
    }

    const useCrossfade = options.useCrossfade === true;
    const restorePosition = options.restorePosition !== false;
    const token = ++this._loadToken;
    this._cancelCrossfade();
    this._clearPendingSeek();
    this._beginTrackLoading();

    const track = this.currentTrack();
    const activeSlot = this._activeSlot;
    const activeAudio = this._audioElements[activeSlot];

    this._persistCurrentPosition();

    if (useCrossfade && shouldPlay) {
      await this._crossfadeToTrack(token, track, restorePosition);
      return;
    }

    activeAudio.pause();
    this.isPlaying.set(false);
    this.duration.set(0);
    this.currentTime.set(0);

    activeAudio.src = track.src;
    activeAudio.load();

    try {
      await this._waitForCanPlay(token, activeAudio);

      if (token !== this._loadToken) {
        return;
      }

      if (restorePosition) {
        this._applySavedPosition(activeAudio, track.id);
      } else {
        activeAudio.currentTime = 0;
        this.currentTime.set(0);
      }

      if (activeAudio.duration) {
        this.duration.set(activeAudio.duration);
      }

      this._endTrackLoading(token);

      if (!shouldPlay) {
        return;
      }

      await this._safePlay(activeAudio);
    } catch {
      this._endTrackLoading(token);

      if (token === this._loadToken) {
        this.isPlaying.set(false);
        this._updateMediaSessionPlaybackState();

        if (shouldPlay) {
          this._notifyAudioError(track);
        }
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



  private _waitForCanPlay(
    token: number,
    audio: HTMLAudioElement,
  ): Promise<void> {

    return new Promise((resolve, reject) => {

      if (token !== this._loadToken) {

        resolve();

        return;

      }



      if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {

        resolve();

        return;

      }



      const onLoadedMetadata = () => {

        cleanup();

        resolve();

      };



      const onError = () => {

        cleanup();

        reject(new Error('Audio load failed'));

      };



      const cleanup = () => {

        audio.removeEventListener('loadedmetadata', onLoadedMetadata);

        audio.removeEventListener('error', onError);

      };



      audio.addEventListener('loadedmetadata', onLoadedMetadata);

      audio.addEventListener('error', onError);

    });

  }



  private async _safePlay(audio: HTMLAudioElement): Promise<void> {

    try {

      await audio.play();

      this.isPlaying.set(true);
      this._updateMediaSessionPlaybackState();

    } catch {

      this.isPlaying.set(false);
      this._updateMediaSessionPlaybackState();

      if (audio.error) {

        this._notifyAudioError(this.currentTrack());

      }

    }

  }



  private get _isBrowser(): boolean {

    return isPlatformBrowser(this._platformId);

  }



  private _attachAudioListeners(audio: HTMLAudioElement, slot: 0 | 1): void {
    if (this._audioWithListeners.has(audio)) {
      return;
    }

    this._audioWithListeners.add(audio);

    audio.addEventListener('ended', () => {
      if (slot !== this._activeSlot) {
        return;
      }

      this._clearSavedPosition(this.currentTrack().id);
      this._advanceTrack(true);
    });

    audio.addEventListener('timeupdate', () => {
      if (slot !== this._activeSlot || this.isDragging()) {
        return;
      }

      if (this._pendingSeekTime !== null) {
        this._tryFlushPendingSeek(audio);
        return;
      }

      this.currentTime.set(audio.currentTime);

      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        this.duration.set(audio.duration);
      }

      this._throttledSavePosition(audio.currentTime);
    });

    audio.addEventListener('progress', () => {
      if (slot !== this._activeSlot) {
        return;
      }

      this._tryFlushPendingSeek(audio);
    });

    audio.addEventListener('loadeddata', () => {
      if (slot !== this._activeSlot) {
        return;
      }

      this._tryFlushPendingSeek(audio);
    });

    audio.addEventListener('canplay', () => {
      if (slot !== this._activeSlot) {
        return;
      }

      this._tryFlushPendingSeek(audio);
    });

    audio.addEventListener('seeked', () => {
      if (slot !== this._activeSlot) {
        return;
      }

      if (this._pendingSeekTime !== null) {
        const target = this._pendingSeekTime;

        if (Math.abs(audio.currentTime - target) < 0.5) {
          this._clearPendingSeek();
          this.currentTime.set(audio.currentTime);
          this._persistCurrentPosition();
        } else if (this._canSeekTo(audio, target)) {
          audio.currentTime = target;
        }

        return;
      }

      this.currentTime.set(audio.currentTime);
    });

    audio.addEventListener('loadedmetadata', () => {
      if (slot !== this._activeSlot) {
        return;
      }

      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        this.duration.set(audio.duration);
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

    const crossfadeItem: ICacheItem = { name: ECacheItemName.CROSSFADE_ENABLED };
    const cachedCrossfade = this._cacheService.useCacheService(
      crossfadeItem,
      ETypeCache.LOCAL,
      ETypeActionCache.LOAD,
    );

    if (cachedCrossfade !== null && cachedCrossfade !== undefined) {
      this.crossfadeEnabled.set(JSON.parse(cachedCrossfade) === true);
    }

    const crossfadeDurationItem: ICacheItem = {
      name: ECacheItemName.CROSSFADE_DURATION_SEC,
    };
    const cachedDuration = this._cacheService.useCacheService(
      crossfadeDurationItem,
      ETypeCache.LOCAL,
      ETypeActionCache.LOAD,
    );

    if (cachedDuration) {
      const parsed = Number.parseInt(cachedDuration, 10);

      if (!Number.isNaN(parsed)) {
        this.crossfadeDurationSec.set(
          Math.min(
            CROSSFADE_DURATION_MAX_SEC,
            Math.max(CROSSFADE_DURATION_MIN_SEC, parsed),
          ),
        );
      }
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

  private _getActiveAudio(): HTMLAudioElement | null {
    return this._audioElements?.[this._activeSlot] ?? null;
  }

  private _cancelCrossfade(): void {
    if (this._crossfadeFrameId !== null) {
      cancelAnimationFrame(this._crossfadeFrameId);
      this._crossfadeFrameId = null;
    }
  }

  private _applyVolumeToSlot(slot: 0 | 1, multiplier: number): void {
    if (!this._audioElements) {
      return;
    }

    this._audioElements[slot].volume = (this.volume() / 100) * multiplier;
  }

  private async _crossfadeToTrack(
    token: number,
    track: ITrack,
    restorePosition: boolean,
  ): Promise<void> {
    if (!this._audioElements) {
      return;
    }

    const outgoingSlot = this._activeSlot;
    const incomingSlot: 0 | 1 = outgoingSlot === 0 ? 1 : 0;
    const outgoing = this._audioElements[outgoingSlot];
    const incoming = this._audioElements[incomingSlot];
    const durationMs = this.crossfadeDurationSec() * 1000;

    this.currentTime.set(0);
    this.duration.set(0);

    incoming.pause();
    incoming.src = track.src;
    incoming.load();

    try {
      await this._waitForCanPlay(token, incoming);

      if (token !== this._loadToken) {
        return;
      }

      if (restorePosition) {
        this._applySavedPosition(incoming, track.id);
      } else {
        incoming.currentTime = 0;
      }

      if (incoming.duration) {
        this.duration.set(incoming.duration);
      }

      this._endTrackLoading(token);

      this._applyVolumeToSlot(incomingSlot, 0);
      await incoming.play();

      if (token !== this._loadToken) {
        incoming.pause();
        return;
      }

      const start = performance.now();

      const animate = () => {
        if (token !== this._loadToken) {
          return;
        }

        const progress = Math.min(1, (performance.now() - start) / durationMs);
        this._applyVolumeToSlot(outgoingSlot, 1 - progress);
        this._applyVolumeToSlot(incomingSlot, progress);
        this.currentTime.set(incoming.currentTime);

        if (incoming.duration) {
          this.duration.set(incoming.duration);
        }

        if (progress < 1) {
          this._crossfadeFrameId = requestAnimationFrame(animate);
          return;
        }

        this._crossfadeFrameId = null;
        outgoing.pause();
        outgoing.currentTime = 0;
        this._activeSlot = incomingSlot;
        this._applyVolumeToSlot(incomingSlot, 1);
        this._applyVolumeToSlot(outgoingSlot, 0);
        this.isPlaying.set(true);
        this.currentTime.set(incoming.currentTime);
        this._updateMediaSessionPlaybackState();
      };

      this._crossfadeFrameId = requestAnimationFrame(animate);
    } catch {
      this._endTrackLoading(token);

      if (token === this._loadToken) {
        this.isPlaying.set(false);
        this._updateMediaSessionPlaybackState();
        this._notifyAudioError(track);
      }
    }
  }

  private _getSavedPosition(trackId: string): number {
    return this._positionsCache[trackId] ?? 0;
  }

  private _clearSavedPosition(trackId: string): void {
    if (!(trackId in this._positionsCache)) {
      return;
    }

    delete this._positionsCache[trackId];
    this._persistPositions();
  }

  private _applySavedPosition(audio: HTMLAudioElement, trackId: string): void {
    const saved = this._getSavedPosition(trackId);

    if (saved > 0 && audio.duration && saved < audio.duration * POSITION_SAVE_END_THRESHOLD) {
      this._seekToTime(audio, saved);
      return;
    }

    this._clearPendingSeek();
    audio.currentTime = 0;
    this.currentTime.set(0);
  }

  private _seekToTime(audio: HTMLAudioElement, time: number): void {
    const duration = audio.duration;

    if (!Number.isFinite(duration) || duration <= 0) {
      return;
    }

    const target = Math.min(duration, Math.max(0, time));
    this.currentTime.set(target);

    if (this._canSeekTo(audio, target)) {
      this._clearPendingSeek();
      audio.currentTime = target;
      this._persistCurrentPosition();
      return;
    }

    this._pendingSeekTime = target;
    this._tryFlushPendingSeek(audio);
  }

  private _canSeekTo(audio: HTMLAudioElement, time: number): boolean {
    const ranges = audio.seekable;

    if (!ranges.length) {
      return time <= 0.05;
    }

    for (let i = 0; i < ranges.length; i++) {
      if (time >= ranges.start(i) - 0.05 && time <= ranges.end(i) + 0.05) {
        return true;
      }
    }

    return false;
  }

  private _tryFlushPendingSeek(audio: HTMLAudioElement): void {
    if (this._pendingSeekTime === null) {
      return;
    }

    const target = this._pendingSeekTime;

    if (!this._canSeekTo(audio, target)) {
      return;
    }

    this._clearPendingSeek();
    audio.currentTime = target;
    this.currentTime.set(target);
    this._persistCurrentPosition();
  }

  private _clearPendingSeek(): void {
    this._pendingSeekTime = null;
  }

  private _beginTrackLoading(): void {
    this.isTrackLoading.set(true);
  }

  private _endTrackLoading(token: number): void {
    if (token === this._loadToken) {
      this.isTrackLoading.set(false);
    }
  }

  private _persistCurrentPosition(): void {
    const audio = this._getActiveAudio();

    if (!audio) {
      return;
    }

    this._savePositionForTrack(
      this.currentTrack().id,
      audio.currentTime,
      audio.duration || this.duration(),
    );
    this._saveLastPlayback(audio.currentTime);
  }

  private _throttledSavePosition(time: number): void {
    const now = Date.now();

    if (now - this._lastPositionSaveAt < POSITION_SAVE_INTERVAL_MS) {
      return;
    }

    this._lastPositionSaveAt = now;
    this._savePositionForTrack(
      this.currentTrack().id,
      time,
      this.duration(),
    );
    this._saveLastPlayback(time);
  }

  private _savePositionForTrack(
    trackId: string,
    time: number,
    duration: number,
  ): void {
    if (time < MIN_POSITION_TO_SAVE_SEC) {
      this._clearSavedPosition(trackId);
      return;
    }

    if (duration && time / duration >= POSITION_SAVE_END_THRESHOLD) {
      this._clearSavedPosition(trackId);
      return;
    }

    this._positionsCache[trackId] = time;
    this._persistPositions();
  }

  private _persistPositions(): void {
    const item: ICacheItem = {
      name: ECacheItemName.PLAYBACK_POSITIONS,
      value: JSON.stringify(this._positionsCache),
    };

    this._cacheService.useCacheService(
      item,
      ETypeCache.LOCAL,
      ETypeActionCache.SAVE,
    );
  }

  private _loadPositionsFromCache(): void {
    const item: ICacheItem = { name: ECacheItemName.PLAYBACK_POSITIONS };
    const cached = this._cacheService.useCacheService(
      item,
      ETypeCache.LOCAL,
      ETypeActionCache.LOAD,
    );

    if (!cached) {
      return;
    }

    try {
      const parsed: unknown = JSON.parse(cached);

      if (parsed && typeof parsed === 'object') {
        this._positionsCache = parsed as Record<string, number>;
      }
    } catch {
      this._positionsCache = {};
    }
  }

  private _saveLastPlayback(currentTime: number): void {
    const item: ICacheItem = {
      name: ECacheItemName.LAST_PLAYBACK,
      value: JSON.stringify({
        trackId: this.currentTrack().id,
        currentTime,
      }),
    };

    this._cacheService.useCacheService(
      item,
      ETypeCache.LOCAL,
      ETypeActionCache.SAVE,
    );
  }

  private _loadLastPlayback(): { trackId: string; currentTime: number } | null {
    const item: ICacheItem = { name: ECacheItemName.LAST_PLAYBACK };
    const cached = this._cacheService.useCacheService(
      item,
      ETypeCache.LOCAL,
      ETypeActionCache.LOAD,
    );

    if (!cached) {
      return null;
    }

    try {
      const parsed = JSON.parse(cached) as {
        trackId?: string;
        currentTime?: number;
      };

      if (!parsed.trackId) {
        return null;
      }

      return {
        trackId: parsed.trackId,
        currentTime: parsed.currentTime ?? 0,
      };
    } catch {
      return null;
    }
  }

  private async _restoreLastPlayback(): Promise<void> {
    const last = this._loadLastPlayback();

    if (!last) {
      return;
    }

    const index = this.playlist().findIndex((track) => track.id === last.trackId);

    if (index === -1) {
      return;
    }

    if (last.currentTime > 0) {
      this._positionsCache[last.trackId] = last.currentTime;
    }

    this._selectTrack(index, false, true, false, true);
  }

  private _persistCrossfadePreferences(): void {
    const enabledItem: ICacheItem = {
      name: ECacheItemName.CROSSFADE_ENABLED,
      value: JSON.stringify(this.crossfadeEnabled()),
    };

    this._cacheService.useCacheService(
      enabledItem,
      ETypeCache.LOCAL,
      ETypeActionCache.SAVE,
    );

    const durationItem: ICacheItem = {
      name: ECacheItemName.CROSSFADE_DURATION_SEC,
      value: this.crossfadeDurationSec().toString(),
    };

    this._cacheService.useCacheService(
      durationItem,
      ETypeCache.LOCAL,
      ETypeActionCache.SAVE,
    );
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
        const audio = this._getActiveAudio();
        if (audio) {
          void this._safePlay(audio);
        }
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

