export interface INewsItem {
  id: string;
  title: string;
  summary: string;
  fullText: string;
  imageUrl: string;
  category: string;
  publishedAt: string;
  source: string;
  artist?: string;
}

export interface IConcert {
  id: string;
  artist: string;
  venue: string;
  city: string;
  country: string;
  date: string;
  imageUrl: string;
  /** Цена билета в рублях */
  ticketPrice: number;
  status: EConcertStatus;
}

export enum EConcertStatus {
  AVAILABLE = 'В продаже',
  FEW_LEFT = 'Мало билетов',
  SOLD_OUT = 'Распродано',
}

export interface ICityGroup {
  label: string;
  value: string;
  items: { label: string; value: string }[];
}
