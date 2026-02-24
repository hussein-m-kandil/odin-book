import {
  input,
  output,
  signal,
  inject,
  Component,
  DestroyRef,
  booleanAttribute,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

  protected readonly maximum = signal(false);
  protected readonly visible = signal(true);

  readonly showHeader = input(true, { transform: booleanAttribute });
  readonly closeAriaLabel = input<string>();
  readonly header = input<string>();

  readonly visibilityChanged = output<boolean>();
  readonly maximizeToggled = output();
  readonly hidden = output();
  readonly shown = output();

  private _pushModalQueryParam() {
    const queryParams = { ...this._activeRoute.snapshot.queryParams, [Query_KEY]: Query_VALUE };
    this._router.navigate(['.'], { relativeTo: this._activeRoute, queryParams });
  }

  private _popModalQueryParam() {
    const queryParams = { ...this._activeRoute.snapshot.queryParams };
    delete queryParams[Query_KEY];
    this._router.navigate(['.'], { relativeTo: this._activeRoute, replaceUrl: true, queryParams });
  }

  protected handleVisibilityChange(visible: boolean) {
    this.visible.set(visible);
    this.visibilityChanged.emit(visible);
  }

  protected handleShow() {
    this._pushModalQueryParam();
    this.shown.emit();
  }

  protected handleHide() {
    this._popModalQueryParam();
    this.hidden.emit();
  }

  protected handleMaximize() {
    this.maximum.update((max) => !max);
    this.maximizeToggled.emit();
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
