export enum ELocalLibraryStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error',
  UNSUPPORTED = 'unsupported',
}

export interface ILocalLibraryMeta {
  folderName: string;
  trackCount: number;
  scannedAt: number;
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
