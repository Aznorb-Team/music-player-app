import {
  ESeverityNotification,
  ESummaryNotification,
} from './notification-service.const';

export interface INotification {
  severity: ESeverityNotification;
  summary: ESummaryNotification;
  detail: string;
}
