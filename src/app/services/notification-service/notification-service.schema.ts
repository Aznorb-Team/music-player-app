import {
  ESeverityNotification,
  ESummuryNotification,
} from './notification-service.const';

export interface INotification {
  severity: ESeverityNotification;
  summary: ESummuryNotification;
  detail: string;
}
