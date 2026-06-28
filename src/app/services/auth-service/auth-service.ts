import {
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CacheService } from '../cache-service/cache-service';
import {
  ETypeActionCache,
  ETypeCache,
  ICacheItem,
} from '../cache-service/cache-service.schema';
import { WINDOW } from '../../core/window/window-injectable';
import { ECacheItemName } from '../../app.consts';
import { NotificationService } from '../notification-service/notification-service';
import {
  ESeverityNotification,
  ESummaryNotification,
} from '../notification-service/notification-service.const';
import {
  DEMO_AUTH_EMAIL,
  DEMO_AUTH_PASSWORD,
} from './auth-service.const';
import { IAuthUser } from './auth-service.schema';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _cacheService = inject(CacheService);
  private readonly _notificationService = inject(NotificationService);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _window = inject(WINDOW);

  private readonly _user = signal<IAuthUser | null>(null);
  private _loaded = false;

  readonly currentUser = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  public ensureLoaded(): void {
    if (this._loaded || !this._isBrowser) {
      return;
    }

    this._loaded = true;
    const item: ICacheItem = { name: ECacheItemName.AUTH_USER };
    const raw = this._cacheService.useCacheService(
      item,
      ETypeCache.LOCAL,
      ETypeActionCache.LOAD,
    );

    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as IAuthUser;
      if (parsed?.id && parsed.email) {
        this._user.set(parsed);
      }
    } catch {
      // ignore invalid cache
    }
  }

  public login(email: string, password: string): boolean {
    const normalizedEmail = email.trim().toLowerCase();

    if (
      normalizedEmail !== DEMO_AUTH_EMAIL ||
      password !== DEMO_AUTH_PASSWORD
    ) {
      this._notificationService.showNotification({
        severity: ESeverityNotification.ERROR,
        summary: ESummaryNotification.ERROR,
        detail: 'Неверный email или пароль. Демо: demo@music.app / demo',
      });
      return false;
    }

    const user: IAuthUser = {
      id: 'demo-user',
      name: 'Demo User',
      email: DEMO_AUTH_EMAIL,
    };

    this._user.set(user);
    this._persistUser(user);
    this._notificationService.showNotification({
      severity: ESeverityNotification.SUCCESS,
      summary: ESummaryNotification.SUCCESS,
      detail: `Добро пожаловать, ${user.name}!`,
    });
    return true;
  }

  public logout(): void {
    this._user.set(null);
    this._window.localStorage?.removeItem(ECacheItemName.AUTH_USER);
    this._notificationService.showNotification({
      severity: ESeverityNotification.INFO,
      summary: ESummaryNotification.INFO,
      detail: 'Вы вышли из аккаунта',
    });
  }

  public clearSession(): void {
    this._user.set(null);
  }

  private _persistUser(user: IAuthUser): void {
    const item: ICacheItem = {
      name: ECacheItemName.AUTH_USER,
      value: JSON.stringify(user),
    };

    this._cacheService.useCacheService(
      item,
      ETypeCache.LOCAL,
      ETypeActionCache.SAVE,
    );
  }

  private get _isBrowser(): boolean {
    return isPlatformBrowser(this._platformId);
  }
}
