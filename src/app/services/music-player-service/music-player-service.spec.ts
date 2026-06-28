import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { MusicPlayerService } from './music-player-service';
import { DEFAULT_PLAYLIST } from './music-player-service.const';
import { ERepeatMode, EQueueContext } from './music-player-service.schema';
import { WINDOW } from '../../core/window/window-injectable';

function createStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => store.delete(key),
    setItem: (key: string, value: string) => store.set(key, value),
  };
}

describe('MusicPlayerService', () => {
  let service: MusicPlayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        MessageService,
        {
          provide: WINDOW,
          useValue: {
            localStorage: createStorageMock(),
            sessionStorage: createStorageMock(),
          },
        },
      ],
    });

    service = TestBed.inject(MusicPlayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize default playlist', () => {
    expect(service.playlist().length).toBe(DEFAULT_PLAYLIST.length);
    expect(service.currentTrack()).toEqual(DEFAULT_PLAYLIST[0]);
  });

  it('should load track by index', () => {
    service.loadTrack(2);

    expect(service.currentIndex()).toBe(2);
    expect(service.currentTrack().title).toBe('Cyberhex');
  });

  it('should play track by id', () => {
    const track = DEFAULT_PLAYLIST[3];
    service.playTrack(track);

    expect(service.currentIndex()).toBe(3);
    expect(service.currentTrack().id).toBe(track.id);
  });

  it('should play first track for artist', () => {
    service.playByArtist('Bad Omens');

    expect(service.currentTrack().artist).toBe('Bad Omens');
    expect(service.currentTrack().title).toBe('Just Pretend');
  });

  it('should move to next and previous track', () => {
    service.loadTrack(1);
    service.next();

    expect(service.currentIndex()).toBe(2);

    service.previous();

    expect(service.currentIndex()).toBe(1);
  });

  it('should stop at last track when repeat is off', () => {
    const lastIndex = service.playlist().length - 1;
    service.loadTrack(lastIndex);
    service.next();

    expect(service.currentIndex()).toBe(lastIndex);
    expect(service.isPlaying()).toBeFalse();
  });

  it('should wrap around when repeat all is enabled', () => {
    service.setRepeatMode(ERepeatMode.ALL);

    const lastIndex = service.playlist().length - 1;
    service.loadTrack(lastIndex);
    service.next();

    expect(service.currentIndex()).toBe(0);
  });

  it('should cycle repeat modes', () => {
    expect(service.repeatMode()).toBe(ERepeatMode.OFF);

    service.cycleRepeatMode();
    expect(service.repeatMode()).toBe(ERepeatMode.ALL);

    service.cycleRepeatMode();
    expect(service.repeatMode()).toBe(ERepeatMode.ONE);

    service.cycleRepeatMode();
    expect(service.repeatMode()).toBe(ERepeatMode.OFF);
  });

  it('should toggle shuffle and keep current track first in queue', () => {
    service.loadTrack(2);
    service.toggleShuffle();

    expect(service.shuffle()).toBeTrue();
    expect(service.queuedTracks()[0]).toEqual(DEFAULT_PLAYLIST[2]);
    expect(service.queuedTracks().length).toBe(DEFAULT_PLAYLIST.length);
  });

  it('should expose queue from current track', () => {
    service.loadTrack(1);

    const queue = service.queuedTracks();

    expect(queue[0]).toEqual(DEFAULT_PLAYLIST[1]);
    expect(queue.length).toBe(DEFAULT_PLAYLIST.length - 1);
  });

  it('should play track from queue offset', () => {
    service.loadTrack(0);
    service.playFromQueueOffset(2);

    expect(service.currentIndex()).toBe(2);
    expect(service.currentTrack().title).toBe('Cyberhex');
  });

  it('should ignore queue offset zero for current track', () => {
    service.loadTrack(2);
    service.playFromQueueOffset(0);

    expect(service.currentIndex()).toBe(2);
  });

  it('should limit queue to favorites context', () => {
    const favorites = [DEFAULT_PLAYLIST[0], DEFAULT_PLAYLIST[2]];

    service.playTrackInContext(
      DEFAULT_PLAYLIST[0],
      favorites,
      EQueueContext.FAVORITES,
    );
    service.next();

    expect(service.currentTrack().id).toBe(DEFAULT_PLAYLIST[2].id);
    expect(service.queueContext()).toBe(EQueueContext.FAVORITES);

    service.next();

    expect(service.currentIndex()).toBe(2);
    expect(service.isPlaying()).toBeFalse();
  });

  it('should limit queue to playlist section context', () => {
    const sectionTracks = DEFAULT_PLAYLIST.slice(1, 4);

    service.playTrackInContext(
      sectionTracks[0],
      sectionTracks,
      EQueueContext.PLAYLIST,
    );

    expect(service.queuedTracks().length).toBe(sectionTracks.length);
    expect(service.queueContext()).toBe(EQueueContext.PLAYLIST);

    service.next();
    service.next();

    expect(service.currentTrack().id).toBe(sectionTracks[2].id);
  });

  it('should update volume and persist it', () => {
    service.setVolume(42);

    expect(service.volume()).toBe(42);
  });

  it('should clamp volume between 0 and 100', () => {
    service.setVolume(150);
    expect(service.volume()).toBe(100);

    service.setVolume(-10);
    expect(service.volume()).toBe(0);
  });

  it('should toggle crossfade preference', () => {
    expect(service.crossfadeEnabled()).toBeTrue();

    service.setCrossfadeEnabled(false);
    expect(service.crossfadeEnabled()).toBeFalse();
  });

  it('should clamp crossfade duration', () => {
    service.setCrossfadeDurationSec(99);
    expect(service.crossfadeDurationSec()).toBe(8);

    service.setCrossfadeDurationSec(0);
    expect(service.crossfadeDurationSec()).toBe(1);
  });

  it('should expose track loading state', () => {
    expect(service.isTrackLoading()).toBeFalse();
  });
});
