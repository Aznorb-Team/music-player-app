import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Card } from 'primeng/card';
import { MusicPlayerService } from '../../services/music-player-service/music-player-service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrl: './settings.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
})
export class SettingsComponent {
  protected readonly musicPlayerService = inject(MusicPlayerService);
}
