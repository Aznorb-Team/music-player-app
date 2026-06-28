export type ESearchResultType =
  | 'track'
  | 'artist'
  | 'album'
  | 'news'
  | 'concert';

export interface ISearchResultItem {
  id: string;
  type: ESearchResultType;
  title: string;
  subtitle?: string;
  route?: string[];
  trackId?: string;
  artistName?: string;
}
