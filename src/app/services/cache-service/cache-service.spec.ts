import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { CacheService } from './cache-service';
import {
  ETypeActionCache,
  ETypeCache,
  ICacheItem,
} from './cache-service.schema';
import { NotificationService } from '../notification-service/notification-service';
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

describe('CacheService', () => {
  let service: CacheService;
  let localStorage: Storage;

  beforeEach(() => {
    localStorage = createStorageMock();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        MessageService,
        {
          provide: WINDOW,
          useValue: {
            localStorage,
            sessionStorage: createStorageMock(),
          },
        },
      ],
    });

    service = TestBed.inject(CacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save and load value from local storage', () => {
    const item: ICacheItem = {
      name: 'TEST_KEY',
      value: 'test-value',
    };

    service.useCacheService(item, ETypeCache.LOCAL, ETypeActionCache.SAVE);

    const loaded = service.useCacheService(
      { name: 'TEST_KEY' },
      ETypeCache.LOCAL,
      ETypeActionCache.LOAD,
    );

    expect(loaded).toBe('test-value');
  });

  it('should notify when saving without value', () => {
    const notificationService = TestBed.inject(NotificationService);
    const spy = spyOn(notificationService, 'showNotification');

    service.useCacheService(
      { name: 'TEST_KEY' },
      ETypeCache.LOCAL,
      ETypeActionCache.SAVE,
    );

    expect(spy).toHaveBeenCalled();
  });
});
