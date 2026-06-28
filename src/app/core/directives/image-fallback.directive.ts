import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';
import { IMAGE_FALLBACK_URL } from '../constants/image-fallback.const';

@Directive({
  selector: 'img[appImageFallback]',
})
export class ImageFallbackDirective {
  private readonly _element = inject(ElementRef<HTMLImageElement>);

  @Input() appImageFallback = IMAGE_FALLBACK_URL;

  private _hasFallback = false;

  @HostListener('error')
  onError(): void {
    if (this._hasFallback) {
      return;
    }

    const img = this._element.nativeElement;

    if (img.src.includes(this.appImageFallback)) {
      return;
    }

    this._hasFallback = true;
    img.src = this.appImageFallback;
  }
}
