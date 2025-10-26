import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { INotification } from './notification-service.schema';

Injectable({
  providedIn: 'root',
});
export class NotificationService {
  private readonly _messageService = inject(MessageService);

  public showNotification(message: INotification): void {
    this._messageService.add(message);
  }
}
