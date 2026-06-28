import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card } from 'primeng/card';

interface IHelpItem {
  question: string;
  answer: string;
}

const HELP_ITEMS: IHelpItem[] = [
  {
    question: 'Как воспроизвести трек?',
    answer:
      'Нажмите кнопку воспроизведения на карточке концерта, новости или в разделе «Плейлисты». Управление доступно в нижнем плеере.',
  },
  {
    question: 'Как добавить трек в избранное?',
    answer:
      'Нажмите иконку сердца в плейлисте, избранном или в нижнем плеере. Список сохраняется локально в браузере.',
  },
  {
    question: 'Какие есть горячие клавиши?',
    answer:
      'Пробел — play/pause, ←/→ — перемотка на 5 сек, Shift+←/→ — предыдущий/следующий трек, ↑/↓ — громкость, M — mute, S — shuffle, R — repeat.',
  },
  {
    question: 'Как переключить тёмную тему?',
    answer:
      'Используйте переключатель в правом верхнем углу рядом с кнопкой «Войти».',
  },
  {
    question: 'Где хранятся настройки?',
    answer:
      'Тема, громкость, избранное и состояние бокового меню сохраняются локально в браузере.',
  },
  {
    question: 'Когда появится авторизация?',
    answer:
      'Вход в аккаунт и синхронизация избранного между устройствами будут добавлены после подключения бэкенда.',
  },
];

@Component({
  selector: 'app-help',
  templateUrl: './help.html',
  styleUrl: './help.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
})
export class HelpComponent {
  protected readonly helpItems = HELP_ITEMS;
}
