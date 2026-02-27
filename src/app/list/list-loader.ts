import {
  input,
  output,
  inject,
  Injector,
  viewChild,
  OnDestroy,
  OnChanges,
  Component,
  ElementRef,
  afterNextRender,
  booleanAttribute,
} from '@angular/core';
import { ErrorMessage } from '../error-message';
import { Button } from 'primeng/button';
import { Spinner } from '../spinner';

@Component({
  selector: 'app-list-loader',
  imports: [ErrorMessage, Spinner, Button],
  templateUrl: './list-loader.html',
  styles: ``,
})
export class ListLoader implements OnChanges, OnDestroy {
  private readonly _injector = inject(Injector);
  private readonly _intersector = viewChild<ElementRef<HTMLElement>>('intersector');
  private readonly _intersectionObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        this.loaded.emit();
        observer.unobserve(entry.target);
      }
    }
  });

  readonly autoLoadMore = input(false, { transform: booleanAttribute });
  readonly pluralLabel = input.required<string>();
  readonly loadError = input.required<string>();
  readonly loading = input.required<boolean>();
  readonly hasMore = input.required<boolean>();
  readonly listSize = input.required<number>();

  readonly loaded = output();

  ngOnChanges() {
    afterNextRender(
      () => {
        if (this.autoLoadMore()) {
          const intersector = this._intersector()?.nativeElement;
          if (intersector) this._intersectionObserver.observe(intersector);
        }
      },
      { injector: this._injector },
    );
  }

  ngOnDestroy() {
    this._intersectionObserver.disconnect();
  }
}
