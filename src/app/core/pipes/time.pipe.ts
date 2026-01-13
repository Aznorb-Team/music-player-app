import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'time',
})
export class TimePipe implements PipeTransform {
  transform(value: number): string {
    if (value) {
      const minutes = Math.floor(value / 60);
      const seconds = Math.floor(value % 60);

      const minutesResult = minutes < 10 ? '0' + minutes : minutes;
      const secondsResult = seconds < 10 ? '0' + seconds : seconds;

      return `${minutesResult}:${secondsResult}`;
    }

    return '00:00';
  }
}
