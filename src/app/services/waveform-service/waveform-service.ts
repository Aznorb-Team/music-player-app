import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const DEFAULT_BAR_COUNT = 120;

@Injectable({
  providedIn: 'root',
})
export class WaveformService {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _cache = new Map<string, number[]>();
  private _audioContext: AudioContext | null = null;

  public async getPeaks(
    src: string,
    barCount = DEFAULT_BAR_COUNT,
  ): Promise<number[]> {
    if (!this._isBrowser) {
      return [];
    }

    const cacheKey = `${src}:${barCount}`;
    const cached = this._cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const peaks = await this._decodePeaks(src, barCount);
      this._cache.set(cacheKey, peaks);
      return peaks;
    } catch {
      return [];
    }
  }

  private async _decodePeaks(src: string, barCount: number): Promise<number[]> {
    const response = await fetch(src);

    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${src}`);
    }

    const buffer = await response.arrayBuffer();
    const context = this._getAudioContext();
    const audioBuffer = await context.decodeAudioData(buffer.slice(0));
    const channel = audioBuffer.getChannelData(0);
    const samplesPerBar = Math.max(1, Math.floor(channel.length / barCount));
    const peaks: number[] = [];

    for (let i = 0; i < barCount; i++) {
      const start = i * samplesPerBar;
      const end = Math.min(channel.length, start + samplesPerBar);
      let peak = 0;

      for (let j = start; j < end; j++) {
        peak = Math.max(peak, Math.abs(channel[j]));
      }

      peaks.push(peak);
    }

    const maxPeak = Math.max(...peaks, 0.001);

    return peaks.map((peak) => peak / maxPeak);
  }

  private _getAudioContext(): AudioContext {
    if (!this._audioContext) {
      this._audioContext = new AudioContext();
    }

    return this._audioContext;
  }

  private get _isBrowser(): boolean {
    return isPlatformBrowser(this._platformId);
  }
}
