export enum ETypeActionCache {
  SAVE = 'save',
  LOAD = 'load',
}

export enum ETypeCache {
  LOCAL = 'LOCAL',
  SESSION = 'SESSION',
}

export interface ICacheItem {
  name: string;
  value?: string;
}
