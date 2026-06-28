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
    question: 'Как переключить тёмную тему?',
    answer:
      'Используйте переключатель в правом верхнем углу рядом с кнопкой «Войти».',
  },
  {
    question: 'Где хранятся настройки?',
    answer:
      'Тема, громкость и состояние бокового меню сохраняются локально в браузере.',
  },
  {
    question: 'Когда появится авторизация?',
    answer:
      'Вход в аккаунт и избранное будут добавлены после подключения бэкенда.',
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
