import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-time',
  imports: [DatePipe],
  templateUrl: './time.html',
  styles: ``,
})
export class Time {
  readonly classes = input<string | string[] | Record<string, unknown>>();
  readonly styles = input<string | Record<string, unknown>>();
  readonly datetime = input.required<string | Date>();
  readonly prefix = input<string>();
  readonly suffix = input<string>();

  protected getDistanceDays(date: Date | string) {
    const dayMS = 24 * 60 * 60 * 1000;
    const nowMS = new Date().getTime();
    const dateMS = new Date(date).getTime();
    return Math.floor((nowMS - dateMS) / dayMS);
  }
}
