import { IMAGE_FALLBACK_URL } from '../../core/constants/image-fallback.const';
import {
  EConcertStatus,
  IConcert,
  ICityGroup,
  INewsItem,
} from './content-service.schema';

/** Локальные изображения из public/images/artists/ */
export const ARTIST_IMAGE_URLS = {
  fallingInReverse: '/images/artists/falling-in-reverse.jpg',
  motionlessInWhite: '/images/artists/motionless-in-white-linkfire.jpg',
  badOmens: '/images/artists/bad-omens.jpg',
  bringMeTheHorizon: '/images/artists/bring-me-the-horizon.jpg',
  fallback: IMAGE_FALLBACK_URL,
} as const;

/** Курс для перевода € → ₽ (примерный) */
const EUR_TO_RUB = 100;

const eurToRub = (eur: number): number => Math.round(eur * EUR_TO_RUB);

export const NEWS_ITEMS: INewsItem[] = [
  {
    id: '1',
    title: 'Falling In Reverse анонсировали мировой тур 2026',
    summary:
      'Группа представила даты европейского и североамериканского тура в поддержку нового альбома. Первые концерты стартуют в марте.',
    fullText:
      'Falling In Reverse официально объявили масштабный мировой тур, который охватит Европу и Северную Америку. Тур станет главной поддержкой нового материала группы и стартует в марте 2026 года.\n\nПервые концерты пройдут в крупнейших аренах Германии и США. Организаторы обещают обновлённое шоу с расширенной сценой, новым сет-листом и сюрпризами для фанатов.\n\nБилеты поступят в продажу в ближайшие недели. Поклонникам рекомендуется следить за анонсами на официальных площадках группы.',
    imageUrl: ARTIST_IMAGE_URLS.fallingInReverse,
    category: 'Тур',
    publishedAt: '2026-06-15',
    source: 'Rock News',
    artist: 'Falling In Reverse',
  },
  {
    id: '2',
    title: 'Motionless In White выпустили клип на «Cyberhex»',
    summary:
      'Новое видео набрало более миллиона просмотров за первые сутки. Режиссёром выступил давний соратник группы.',
    fullText:
      'Motionless In White представили официальный клип на трек «Cyberhex» — один из самых ожидаемых синглов альбома Scoring the End of the World.\n\nВидео снято в мрачной киберпанк-эстетике и за первые 24 часа собрало более миллиона просмотров. Режиссёром выступил давний соратник коллектива, ранее работавший над клипами Bring Me The Horizon.\n\nФанаты отмечают визуальную смелость и отсылки к ранним работам группы. Клип уже занял верхние строчки рок-чартов YouTube.',
    imageUrl: ARTIST_IMAGE_URLS.motionlessInWhite,
    category: 'Релиз',
    publishedAt: '2026-06-10',
    source: 'Metal Hammer',
    artist: 'Motionless In White',
  },
  {
    id: '3',
    title: 'Bad Omens объявили фестивальный сет-лист лета',
    summary:
      'Группа выступит на крупнейших рок-фестивалях Европы, включая Download и Rock am Ring.',
    fullText:
      'Bad Omens подтвердили участие в ряде крупнейших рок-фестивалей лета 2026 года. Группа выступит на Download Festival, Rock am Ring и нескольких европейских площадках.\n\nОжидается, что сет-лист будет включать хиты с альбома The Death of Peace of Mind, а также новые композиции. Организаторы фестивалей называют Bad Omens одним из главных хедлайнеров сезона.\n\nРасписание выступлений и точные даты будут опубликованы на сайтах фестивалей в ближайшее время.',
    imageUrl: ARTIST_IMAGE_URLS.badOmens,
    category: 'Фестиваль',
    publishedAt: '2026-06-05',
    source: 'Kerrang!',
    artist: 'Bad Omens',
  },
  {
    id: '4',
    title: 'Новый альбом Bring Me The Horizon — в октябре',
    summary:
      'Oli Sykes подтвердил, что запись завершена. Первый сингл выйдет уже в июле.',
    fullText:
      'Oli Sykes в интервью подтвердил, что запись нового альбома Bring Me The Horizon полностью завершена. Релиз запланирован на октябрь 2026 года.\n\nПервый сингл выйдет уже в июле. По словам фронтмена, новый материал продолжает линию POST HUMAN, но при этом звучит «ещё тяжелее и экспериментальнее».\n\nГруппа также анонсировала серию интимных клубных шоу перед мировым туром, где представит новые песни вживую.',
    imageUrl: ARTIST_IMAGE_URLS.bringMeTheHorizon,
    category: 'Альбом',
    publishedAt: '2026-06-01',
    source: 'NME',
    artist: 'Bring Me The Horizon',
  },
];

export const CONCERTS: IConcert[] = [
  {
    id: '1',
    artist: 'Falling In Reverse',
    venue: 'Mercedes-Benz Arena',
    city: 'Berlin',
    country: 'Germany',
    date: '2026-09-12',
    imageUrl: ARTIST_IMAGE_URLS.fallingInReverse,
    ticketPrice: eurToRub(65),
    status: EConcertStatus.AVAILABLE,
  },
  {
    id: '2',
    artist: 'Motionless In White',
    venue: 'Olympiahalle',
    city: 'Munich',
    country: 'Germany',
    date: '2026-09-18',
    imageUrl: ARTIST_IMAGE_URLS.motionlessInWhite,
    ticketPrice: eurToRub(55),
    status: EConcertStatus.FEW_LEFT,
  },
  {
    id: '3',
    artist: 'Bad Omens',
    venue: 'Madison Square Garden',
    city: 'New York',
    country: 'USA',
    date: '2026-10-03',
    imageUrl: ARTIST_IMAGE_URLS.badOmens,
    ticketPrice: eurToRub(89),
    status: EConcertStatus.AVAILABLE,
  },
  {
    id: '4',
    artist: 'Falling In Reverse',
    venue: 'Staples Center',
    city: 'Los Angeles',
    country: 'USA',
    date: '2026-10-15',
    imageUrl: ARTIST_IMAGE_URLS.fallingInReverse,
    ticketPrice: eurToRub(95),
    status: EConcertStatus.SOLD_OUT,
  },
  {
    id: '5',
    artist: 'Motionless In White',
    venue: 'Budokan',
    city: 'Tokyo',
    country: 'Japan',
    date: '2026-11-08',
    imageUrl: ARTIST_IMAGE_URLS.motionlessInWhite,
    ticketPrice: eurToRub(72),
    status: EConcertStatus.AVAILABLE,
  },
  {
    id: '6',
    artist: 'Bad Omens',
    venue: 'Zepp Osaka',
    city: 'Osaka',
    country: 'Japan',
    date: '2026-11-12',
    imageUrl: ARTIST_IMAGE_URLS.badOmens,
    ticketPrice: eurToRub(68),
    status: EConcertStatus.FEW_LEFT,
  },
  {
    id: '7',
    artist: 'Falling In Reverse',
    venue: 'United Center',
    city: 'Chicago',
    country: 'USA',
    date: '2026-10-20',
    imageUrl: ARTIST_IMAGE_URLS.fallingInReverse,
    ticketPrice: eurToRub(78),
    status: EConcertStatus.AVAILABLE,
  },
  {
    id: '8',
    artist: 'Motionless In White',
    venue: 'Barclays Center',
    city: 'New York',
    country: 'USA',
    date: '2026-10-25',
    imageUrl: ARTIST_IMAGE_URLS.motionlessInWhite,
    ticketPrice: eurToRub(82),
    status: EConcertStatus.AVAILABLE,
  },
];

export const CITY_GROUPS: ICityGroup[] = [
  {
    label: 'Germany',
    value: 'de',
    items: [
      { label: 'Berlin', value: 'Berlin' },
      { label: 'Frankfurt', value: 'Frankfurt' },
      { label: 'Hamburg', value: 'Hamburg' },
      { label: 'Munich', value: 'Munich' },
    ],
  },
  {
    label: 'USA',
    value: 'us',
    items: [
      { label: 'Chicago', value: 'Chicago' },
      { label: 'Los Angeles', value: 'Los Angeles' },
      { label: 'New York', value: 'New York' },
      { label: 'San Francisco', value: 'San Francisco' },
    ],
  },
  {
    label: 'Japan',
    value: 'jp',
    items: [
      { label: 'Kyoto', value: 'Kyoto' },
      { label: 'Osaka', value: 'Osaka' },
      { label: 'Tokyo', value: 'Tokyo' },
      { label: 'Yokohama', value: 'Yokohama' },
    ],
  },
];

export const NEWS_CAROUSEL_RESPONSIVE_OPTIONS = [
  { breakpoint: '1400px', numVisible: 2, numScroll: 1 },
  { breakpoint: '991px', numVisible: 1, numScroll: 1 },
];
