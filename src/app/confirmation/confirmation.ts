import { Component, input, output } from '@angular/core';
import { Button, ButtonSeverity } from 'primeng/button';

export interface ConfirmationAction {
  severity: ButtonSeverity;
  ariaLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  icon?: string;
}

@Component({
  selector: 'app-confirmation',
  imports: [Button],
  templateUrl: './confirmation.html',
  styles: ``,
})
export class Confirmation {
  readonly accept = input<ConfirmationAction>();
  readonly reject = input<ConfirmationAction>();
  readonly ariaLabelledBy = input<string>();
  readonly ariaLabel = input<string>();

  readonly accepted = output();
  readonly rejected = output();

  protected submit(event: SubmitEvent) {
    event.preventDefault();
    this.accepted.emit();
  }

  protected cancel() {
    this.rejected.emit();
  }
}
