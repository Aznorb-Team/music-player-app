import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Toolbar } from 'primeng/toolbar';
import { Avatar } from 'primeng/avatar';
import { Button } from 'primeng/button';
import { ProgressBar } from 'primeng/progressbar';
import { Slider } from 'primeng/slider';
import { Popover } from 'primeng/popover';

@Component({
  selector: 'music-player',
  templateUrl: './music-player.html',
  styleUrls: ['./music-player.less'],
  standalone: true,
  imports: [Toolbar, Avatar, Button, ProgressBar, Slider, Popover],
})
export class MusicPlayerComponent implements OnInit {
  private readonly _dr = inject(DestroyRef);

  public ngOnInit(): void {
    console.log('OnInit state!');
  }
}
