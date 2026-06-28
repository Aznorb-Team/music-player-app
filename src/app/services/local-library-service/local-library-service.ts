import './local-library-service.types';
import { DOCUMENT } from '@angular/common';
import { Injector, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CacheService } from '../cache-service/cache-service';
import {
  ETypeActionCache,
  ETypeCache,
  ICacheItem,
} from '../cache-service/cache-service.schema';
import { ECacheItemName } from '../../app.consts';
import { WINDOW } from '../../core/window/window-injectable';
import { IMAGE_FALLBACK_URL } from '../../core/constants/image-fallback.const';
import { ITrack } from '../music-player-service/music-player-service.schema';
import { MusicPlayerService } from '../music-player-service/music-player-service';
import {
  clearDirectoryHandle,
  loadDirectoryHandle,
  saveDirectoryHandle,
} from './local-library-idb';
import {
  AUDIO_FILE_EXTENSIONS,
  LOCAL_LIBRARY_SRC_PREFIX,
  UNKNOWN_ALBUM_LABEL,
  UNKNOWN_ARTIST_LABEL,
} from './local-library-service.const';
import {
  ELocalLibraryBackend,
  ELocalLibraryStatus,
  ILocalFileEntry,
  ILocalLibraryMeta,
} from './local-library-service.schema';
import {
  ESeverityNotification,
  ESummaryNotification,
} from '../notification-service/notification-service.const';
import { NotificationService } from '../notification-service/notification-service';

export function isLocalLibrarySrc(src: string): boolean {
  return src.startsWith(LOCAL_LIBRARY_SRC_PREFIX);
}

export function localLibrarySrcFromTrackId(trackId: string): string {
  return `${LOCAL_LIBRARY_SRC_PREFIX}${encodeURIComponent(trackId)}`;
}

export function trackIdFromLocalLibrarySrc(src: string): string {
  return decodeURIComponent(src.slice(LOCAL_LIBRARY_SRC_PREFIX.length));
}

@Injectable({
  providedIn: 'root',
})
export class LocalLibraryService {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _document = inject(DOCUMENT);
  private readonly _cacheService = inject(CacheService);
  private readonly _notificationService = inject(NotificationService);
  private readonly _injector = inject(Injector);
  private readonly _window = inject(WINDOW);

  readonly status = signal<ELocalLibraryStatus>(ELocalLibraryStatus.IDLE);
  readonly folderName = signal<string | null>(null);
  readonly trackCount = signal(0);
  readonly isActive = signal(false);
  readonly lastError = signal<string | null>(null);
  readonly backend = signal<ELocalLibraryBackend | null>(null);

  private _directoryHandle: FileSystemDirectoryHandle | null = null;
  private readonly _fileHandles = new Map<string, FileSystemFileHandle>();
  private readonly _files = new Map<string, File>();
  private readonly _coverObjectUrls = new Map<string, string>();

  public isSupported(): boolean {
    return this._isBrowser;
  }

  public isFileSystemAccessSupported(): boolean {
    return (
      this._isBrowser &&
      typeof this._window.showDirectoryPicker === 'function'
    );
  }

  public usesFileInputFallback(): boolean {
    return this.isSupported() && !this.isFileSystemAccessSupported();
  }

  public async tryRestoreFromCache(): Promise<void> {
    if (!this.isSupported()) {
      this.status.set(ELocalLibraryStatus.UNSUPPORTED);
      return;
    }

    const meta = this._loadMeta();

    if (!meta) {
      return;
    }

    if (meta.backend === ELocalLibraryBackend.FILE_INPUT) {
      this.folderName.set(meta.folderName);
      this.trackCount.set(meta.trackCount);
      this.backend.set(meta.backend);
      this.status.set(ELocalLibraryStatus.IDLE);
      return;
    }

    if (!this.isFileSystemAccessSupported()) {
      this._clearMeta();
      return;
    }

    const handle = await loadDirectoryHandle();

    if (!handle) {
      this._clearMeta();
      return;
    }

    const permission = await handle.queryPermission?.({ mode: 'read' });

    if (permission && permission !== 'granted') {
      this.folderName.set(meta.folderName);
      this.trackCount.set(meta.trackCount);
      this.backend.set(meta.backend);
      this.status.set(ELocalLibraryStatus.IDLE);
      this._directoryHandle = handle;
      return;
    }

    try {
      await this._activateDirectory(handle, meta.folderName, false);
    } catch {
      this._clearMeta();
      await clearDirectoryHandle();
    }
  }

  public async pickFolder(): Promise<void> {
    if (!this.isSupported()) {
      this.status.set(ELocalLibraryStatus.UNSUPPORTED);
      return;
    }

    if (this.isFileSystemAccessSupported()) {
      await this._pickFolderViaFsAccess();
      return;
    }

    await this._pickFolderViaFileInput();
  }

  public async reconnectFolder(): Promise<void> {
    if (this.isFileSystemAccessSupported()) {
      await this._reconnectFsAccessFolder();
      return;
    }

    await this._pickFolderViaFileInput();
  }

  public async rescanFolder(): Promise<void> {
    if (
      this.backend() === ELocalLibraryBackend.FS_ACCESS &&
      this._directoryHandle
    ) {
      await this._scanAndApply(
        this._directoryHandle,
        this.folderName() ?? this._directoryHandle.name,
        ELocalLibraryBackend.FS_ACCESS,
      );
      return;
    }

    await this._pickFolderViaFileInput();
  }

  public async disconnect(): Promise<void> {
    this._revokeCoverUrls();
    this._fileHandles.clear();
    this._files.clear();
    this._directoryHandle = null;
    this.folderName.set(null);
    this.trackCount.set(0);
    this.isActive.set(false);
    this.backend.set(null);
    this.lastError.set(null);
    this.status.set(
      this.isSupported() ? ELocalLibraryStatus.IDLE : ELocalLibraryStatus.UNSUPPORTED,
    );
    this._clearMeta();
    await clearDirectoryHandle();
    this._getPlayer().restoreBuiltinPlaylist();
  }

  public async getAudioBlob(trackId: string): Promise<Blob> {
    const file = this._files.get(trackId);

    if (file) {
      return file.slice(0, file.size, file.type || 'audio/mpeg');
    }

    const handle = this._fileHandles.get(trackId);

    if (!handle) {
      throw new Error(`Local track not found: ${trackId}`);
    }

    const handleFile = await handle.getFile();
    return handleFile.slice(0, handleFile.size, handleFile.type || 'audio/mpeg');
  }

  private async _pickFolderViaFsAccess(): Promise<void> {
    try {
      const picker = this._window.showDirectoryPicker;

      if (!picker) {
        this.status.set(ELocalLibraryStatus.UNSUPPORTED);
        return;
      }

      const handle = await picker.call(this._window, { mode: 'read' });
      await this._activateDirectory(handle, handle.name, true);
    } catch (error) {
      if (this._isUserCancellation(error)) {
        return;
      }

      this.status.set(ELocalLibraryStatus.ERROR);
      this.lastError.set('Не удалось открыть папку');
      this._notifyError('Не удалось открыть папку с музыкой');
    }
  }

  private async _reconnectFsAccessFolder(): Promise<void> {
    const handle = this._directoryHandle ?? (await loadDirectoryHandle());

    if (!handle) {
      await this._pickFolderViaFsAccess();
      return;
    }

    const permission = await handle.requestPermission?.({ mode: 'read' });

    if (permission && permission !== 'granted') {
      this._notifyError('Нет доступа к выбранной папке');
      return;
    }

    const meta = this._loadMeta();
    await this._activateDirectory(handle, meta?.folderName ?? handle.name, false);
  }

  private async _pickFolderViaFileInput(): Promise<void> {
    try {
      const files = await this._openDirectoryFilePicker();

      if (!files.length) {
        return;
      }

      const folderName =
        this._loadMeta()?.folderName ??
        this._folderNameFromFiles(files) ??
        'Локальная папка';

      await this._applyFiles(files, folderName);
    } catch {
      this.status.set(ELocalLibraryStatus.ERROR);
      this.lastError.set('Не удалось открыть папку');
      this._notifyError('Не удалось открыть папку с музыкой');
    }
  }

  private _openDirectoryFilePicker(): Promise<File[]> {
    return new Promise((resolve) => {
      const input = this._document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.setAttribute('webkitdirectory', '');
      input.setAttribute('directory', '');
      input.style.display = 'none';

      const finish = (files: File[]) => {
        input.remove();
        resolve(files);
      };

      input.addEventListener('change', () => {
        const list = input.files ? [...input.files] : [];
        finish(list.filter((file) => this._isAudioFile(file.name)));
      });

      this._document.body.appendChild(input);
      input.click();
    });
  }

  private _folderNameFromFiles(files: File[]): string | null {
    const relativePath = files[0]?.webkitRelativePath;

    if (!relativePath) {
      return null;
    }

    const root = relativePath.split('/')[0];

    return root || null;
  }

  private async _activateDirectory(
    handle: FileSystemDirectoryHandle,
    folderName: string,
    persistHandle: boolean,
  ): Promise<void> {
    this.status.set(ELocalLibraryStatus.LOADING);
    this.lastError.set(null);
    this._directoryHandle = handle;

    if (persistHandle) {
      await saveDirectoryHandle(handle);
    }

    await this._scanAndApply(handle, folderName, ELocalLibraryBackend.FS_ACCESS);
  }

  private async _applyFiles(files: File[], folderName: string): Promise<void> {
    this.status.set(ELocalLibraryStatus.LOADING);
    this._fileHandles.clear();
    this._files.clear();
    this._revokeCoverUrls();

    const tracks: ITrack[] = [];

    for (const file of files) {
      const relativePath = file.webkitRelativePath || file.name;
      const track = await this._buildTrackFromFile(file, relativePath);

      if (track) {
        tracks.push(track);
      }
    }

    await this._finalizePlaylist(tracks, folderName, ELocalLibraryBackend.FILE_INPUT);
  }

  private async _scanAndApply(
    handle: FileSystemDirectoryHandle,
    folderName: string,
    backend: ELocalLibraryBackend,
  ): Promise<void> {
    this.status.set(ELocalLibraryStatus.LOADING);

    const entries = await this._collectAudioFiles(handle);
    this._fileHandles.clear();
    this._files.clear();
    this._revokeCoverUrls();

    const tracks: ITrack[] = [];

    for (const entry of entries) {
      const track = await this._buildTrackFromHandle(entry);

      if (track) {
        tracks.push(track);
      }
    }

    await this._finalizePlaylist(tracks, folderName, backend);
  }

  private async _finalizePlaylist(
    tracks: ITrack[],
    folderName: string,
    backend: ELocalLibraryBackend,
  ): Promise<void> {
    tracks.sort((a, b) => {
      const artist = a.artist.localeCompare(b.artist, 'ru');
      return artist !== 0 ? artist : a.title.localeCompare(b.title, 'ru');
    });

    if (!tracks.length) {
      this.status.set(ELocalLibraryStatus.ERROR);
      this.lastError.set('В папке нет поддерживаемых аудиофайлов');
      this._notifyError('В выбранной папке нет поддерживаемых аудиофайлов');
      return;
    }

    this.folderName.set(folderName);
    this.trackCount.set(tracks.length);
    this.isActive.set(true);
    this.backend.set(backend);
    this.status.set(ELocalLibraryStatus.READY);
    this._saveMeta({
      folderName,
      trackCount: tracks.length,
      scannedAt: Date.now(),
      backend,
    });

    this._getPlayer().applyLocalPlaylist(tracks);

    this._notificationService.showNotification({
      severity: ESeverityNotification.SUCCESS,
      summary: ESummaryNotification.SUCCESS,
      detail: `Загружено треков: ${tracks.length}`,
    });
  }

  private async _buildTrackFromHandle(
    entry: ILocalFileEntry,
  ): Promise<ITrack | null> {
    const file = await entry.handle.getFile();
    return this._buildTrackFromFile(file, entry.relativePath, entry.handle);
  }

  private async _buildTrackFromFile(
    file: File,
    relativePath: string,
    handle?: FileSystemFileHandle,
  ): Promise<ITrack | null> {
    try {
      const buffer = await file.arrayBuffer();
      const metadata = await this._parseMetadata(buffer, file.type || undefined);

      const title =
        metadata.common.title?.trim() || this._titleFromFileName(file.name);
      const artist =
        metadata.common.artist?.trim() ||
        metadata.common.artists?.[0]?.trim() ||
        UNKNOWN_ARTIST_LABEL;
      const album = metadata.common.album?.trim() || UNKNOWN_ALBUM_LABEL;
      const genres = this._normalizeGenres(metadata.common.genre);
      const id = relativePath;

      if (handle) {
        this._fileHandles.set(id, handle);
      } else {
        this._files.set(id, file);
      }

      const coverUrl = this._extractCoverUrl(metadata, id);

      return {
        id,
        title,
        artist,
        album,
        genres,
        localPath: relativePath,
        src: localLibrarySrcFromTrackId(id),
        coverUrl,
        source: 'local-fs',
      };
    } catch {
      const id = relativePath;

      if (handle) {
        this._fileHandles.set(id, handle);
      } else {
        this._files.set(id, file);
      }

      return {
        id,
        title: this._titleFromFileName(file.name),
        artist: UNKNOWN_ARTIST_LABEL,
        album: UNKNOWN_ALBUM_LABEL,
        localPath: relativePath,
        src: localLibrarySrcFromTrackId(id),
        coverUrl: IMAGE_FALLBACK_URL,
        source: 'local-fs',
      };
    }
  }

  private _extractCoverUrl(
    metadata: {
      common: {
        picture?: Array<{ data: Uint8Array; format?: string }>;
      };
    },
    trackId: string,
  ): string {
    const picture = metadata.common.picture?.[0];

    if (!picture?.data?.length) {
      return IMAGE_FALLBACK_URL;
    }

    const blob = new Blob([picture.data], {
      type: picture.format || 'image/jpeg',
    });
    const url = URL.createObjectURL(blob);
    this._coverObjectUrls.set(trackId, url);
    return url;
  }

  private async _parseMetadata(buffer: ArrayBuffer, mimeType?: string) {
    const { parseBuffer } = await import('music-metadata');

    return parseBuffer(new Uint8Array(buffer), {
      mimeType,
    });
  }

  private async _collectAudioFiles(
    directory: FileSystemDirectoryHandle,
    parentPath = '',
  ): Promise<ILocalFileEntry[]> {
    const entries: ILocalFileEntry[] = [];

    for await (const item of directory.values()) {
      if (item.kind === 'file' && this._isAudioFile(item.name)) {
        entries.push({
          handle: item as FileSystemFileHandle,
          relativePath: parentPath ? `${parentPath}/${item.name}` : item.name,
        });
        continue;
      }

      if (item.kind === 'directory') {
        const nested = await this._collectAudioFiles(
          item as FileSystemDirectoryHandle,
          parentPath ? `${parentPath}/${item.name}` : item.name,
        );
        entries.push(...nested);
      }
    }

    return entries;
  }

  private _isAudioFile(fileName: string): boolean {
    const lower = fileName.toLowerCase();
    return AUDIO_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext));
  }

  private _titleFromFileName(fileName: string): string {
    const dotIndex = fileName.lastIndexOf('.');

    return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  }

  private _normalizeGenres(genres: string[] | undefined): string[] {
    if (!genres?.length) {
      return [];
    }

    const unique = new Set<string>();

    for (const genre of genres) {
      const slug = genre
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '');

      if (slug) {
        unique.add(slug);
      }
    }

    return [...unique];
  }

  private _saveMeta(meta: ILocalLibraryMeta): void {
    const item: ICacheItem = {
      name: ECacheItemName.LOCAL_LIBRARY_META,
      value: JSON.stringify(meta),
    };

    this._cacheService.useCacheService(
      item,
      ETypeCache.LOCAL,
      ETypeActionCache.SAVE,
    );
  }

  private _loadMeta(): ILocalLibraryMeta | null {
    const item: ICacheItem = { name: ECacheItemName.LOCAL_LIBRARY_META };
    const raw = this._cacheService.useCacheService(
      item,
      ETypeCache.LOCAL,
      ETypeActionCache.LOAD,
    );

    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as ILocalLibraryMeta;

      return {
        ...parsed,
        backend: parsed.backend ?? ELocalLibraryBackend.FS_ACCESS,
      };
    } catch {
      return null;
    }
  }

  private _clearMeta(): void {
    this._window.localStorage?.removeItem(ECacheItemName.LOCAL_LIBRARY_META);
  }

  private _revokeCoverUrls(): void {
    for (const url of this._coverObjectUrls.values()) {
      URL.revokeObjectURL(url);
    }

    this._coverObjectUrls.clear();
  }

  private _getPlayer(): MusicPlayerService {
    return this._injector.get(MusicPlayerService);
  }

  private _notifyError(detail: string): void {
    this._notificationService.showNotification({
      severity: ESeverityNotification.ERROR,
      summary: ESummaryNotification.ERROR,
      detail,
    });
  }

  private _isUserCancellation(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
  }

  private get _isBrowser(): boolean {
    return isPlatformBrowser(this._platformId);
  }
}
