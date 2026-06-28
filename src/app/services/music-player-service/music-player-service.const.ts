import { ITrack } from './music-player-service.schema';
import { ARTIST_IMAGE_URLS } from '../content-service/content-service.const';
const DRUGS_LYRICS = `'Cause everybody's on drugs
Kill yourself is what they said to me
I'm already dead, just differently
They say God is real, I disagree
'Cause if that were true
Then we'd all be free, all be free, yeah, yeah
Running from something that's killing me
Dealing with such an uncomfortable feeling
Beginning to feel the hostility from my ability of slowly becoming the villain
I just wanna thank all my fans especially, without you is the death of me
'Cause everybody's on drugs`;

export const TRACK_SOURCES = {
  firDrugs: '/audio/Falling In Reverse - Drugs.mp3',
  firVoices: '/audio/Falling In Reverse - Drugs.mp3',
  miwCyberhex: '/audio/motionless-in-white-cyberhex.mp3',
  badOmensJustPretend: '/audio/motionless-in-white-cyberhex.mp3',
  bmthTeardrops: '/audio/Falling In Reverse - Drugs.mp3',
} as const;

export const DEFAULT_PLAYLIST: ITrack[] = [
  {
    id: '1',
    title: 'DRUGS',
    artist: 'Falling In Reverse',
    album: 'The Drug in Me Is You',
    src: TRACK_SOURCES.firDrugs,
    coverUrl: ARTIST_IMAGE_URLS.fallingInReverse,
    source: 'local',
    lyrics: DRUGS_LYRICS,
  },
  {
    id: '2',
    title: 'Voices In My Head',
    artist: 'Falling In Reverse',
    album: 'Popular Monster',
    src: TRACK_SOURCES.firVoices,
    coverUrl: ARTIST_IMAGE_URLS.fallingInReverse,
    source: 'local',
    lyrics:
      'Voices in my head, they talk to me\nThey tell me all the things I should have said\nRunning through my mind, they never leave\nPopular monster, that is what they see',
  },
  {
    id: '3',
    title: 'Cyberhex',
    artist: 'Motionless In White',
    album: 'Scoring the End of the World',
    src: TRACK_SOURCES.miwCyberhex,
    coverUrl: ARTIST_IMAGE_URLS.motionlessInWhite,
    source: 'local',
    lyrics:
      'Welcome to the cyberhex\nWe are the virus, you are the cure\nScreaming at the end of the world\nNothing sacred, nothing pure',
  },
  {
    id: '4',
    title: 'Just Pretend',
    artist: 'Bad Omens',
    album: 'The Death of Peace of Mind',
    src: TRACK_SOURCES.badOmensJustPretend,
    coverUrl: ARTIST_IMAGE_URLS.badOmens,
    source: 'local',
    lyrics:
      'If I let you down, just pretend it\'s all okay\nI\'m not the man I used to be, I\'m not the same\nJust pretend that I\'m still here and nothing changed',
  },
  {
    id: '5',
    title: 'Teardrops',
    artist: 'Bring Me The Horizon',
    album: 'POST HUMAN: SURVIVAL HORROR',
    src: TRACK_SOURCES.bmthTeardrops,
    coverUrl: ARTIST_IMAGE_URLS.bringMeTheHorizon,
    source: 'local',
    lyrics:
      'We\'re just teardrops in the rain\nFalling down, washed away again\nPost-human, we survive the horror\nDancing while the world falls down',
  },
];

export const CAROUSEL_RESPONSIVE_OPTIONS = [
  { breakpoint: '1400px', numVisible: 3, numScroll: 1 },
  { breakpoint: '1199px', numVisible: 2, numScroll: 1 },
  { breakpoint: '767px', numVisible: 2, numScroll: 1 },
  { breakpoint: '575px', numVisible: 1, numScroll: 1 },
];
