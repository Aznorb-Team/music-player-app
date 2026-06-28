export interface IGenreItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  trackCount?: number;
}

export const GENRE_ITEMS: IGenreItem[] = [
  {
    id: 'metalcore',
    name: 'Metalcore',
    description: 'Сочетание тяжёлых риффов и мелодичных припевов',
    icon: 'pi pi-bolt',
  },
  {
    id: 'post-hardcore',
    name: 'Post-Hardcore',
    description: 'Эмоциональный вокал и экспериментальные аранжировки',
    icon: 'pi pi-wave-pulse',
  },
  {
    id: 'alternative-metal',
    name: 'Alternative Metal',
    description: 'Альтернативный метал с элементами электроники',
    icon: 'pi pi-star',
  },
  {
    id: 'rock',
    name: 'Rock',
    description: 'Современный рок и его поджанры',
    icon: 'pi pi-discord',
  },
];

export const ARTIST_GENRE_MAP: Record<string, string[]> = {
  'Falling In Reverse': ['metalcore', 'rock'],
  'Motionless In White': ['metalcore', 'post-hardcore'],
  'Bad Omens': ['alternative-metal', 'metalcore'],
  'Bring Me The Horizon': ['alternative-metal', 'rock'],
};
