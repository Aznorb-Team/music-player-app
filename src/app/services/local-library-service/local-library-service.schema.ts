export enum ELocalLibraryStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error',
  UNSUPPORTED = 'unsupported',
}

export enum ELocalLibraryBackend {
  FS_ACCESS = 'fs-access',
  FILE_INPUT = 'file-input',
}

export interface ILocalLibraryMeta {
  folderName: string;
  trackCount: number;
  scannedAt: number;
  backend: ELocalLibraryBackend;
}

export interface ILocalFileEntry {
  handle: FileSystemFileHandle;
  relativePath: string;
}

export interface ICachedLocalTrackMeta {
  id: string;
  title: string;
  artist: string;
  album?: string;
  localPath: string;
  genres?: string[];
}
