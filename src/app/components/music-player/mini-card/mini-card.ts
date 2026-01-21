import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Card } from 'primeng/card';
import { Fieldset } from 'primeng/fieldset';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { Button } from 'primeng/button';

@Component({
  selector: 'mini-card',
  templateUrl: './mini-card.html',
  styleUrls: ['./mini-card.less'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, ScrollPanelModule, Fieldset, Button],
})
export class MiniCardComponent {}
