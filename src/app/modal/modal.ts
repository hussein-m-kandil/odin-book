import {
  booleanAttribute,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Dialog } from 'primeng/dialog';
import { filter } from 'rxjs';

export const Query_KEY = 'modal';
export const Query_VALUE = 'okay';

@Component({
  selector: 'app-modal',
  imports: [Dialog],
  templateUrl: './modal.html',
  styles: ``,
})
export class Modal {
  private readonly _activeRoute = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _router = inject(Router);

  protected readonly visible = signal(true);

  readonly showHeader = input(true, { transform: booleanAttribute });
  readonly closeAriaLabel = input<string>();
  readonly header = input<string>();

  readonly visibilityChanged = output<boolean>();
  readonly maximized = output();
  readonly hidden = output();
  readonly shown = output();

  private _pushModalRoute() {
    this._router.navigate(['.'], {
      queryParams: { [Query_KEY]: Query_VALUE },
      relativeTo: this._activeRoute,
    });
  }

  private _popModalRoute() {
    this._router.navigate(['.'], { relativeTo: this._activeRoute, replaceUrl: true });
  }

  protected handleVisibilityChange(visible: boolean) {
    this.visible.set(visible);
    this.visibilityChanged.emit(visible);
  }

  protected handleShow() {
    this._pushModalRoute();
    this.shown.emit();
  }

  protected handleHide() {
    this._popModalRoute();
    this.hidden.emit();
  }

  protected handleMaximize() {
    this.maximized.emit();
  }

  constructor() {
    this._router.events
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      )
      .subscribe((event) => {
        if (this.visible() && !event.urlAfterRedirects.includes(`${Query_KEY}=${Query_VALUE}`)) {
          this.visible.set(false);
        }
      });
  }
}
