import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { Modal, Query_KEY, Query_VALUE } from './modal';
import { Router, RouterLink } from '@angular/router';

const navigationSpy = vi.spyOn(Router.prototype, 'navigate');

const renderComponent = (options: RenderComponentOptions<Modal> = {}) => {
  return render(Modal, { autoDetectChanges: false, ...options });
};

describe('Modal', () => {
  afterEach(vi.resetAllMocks);

  it('should display a dialog with the projected content', async () => {
    const name = 'Test a customized modal';
    await render(`<app-modal><div><button type="button">${name}</button></div></app-modal>`, {
      autoDetectChanges: false,
      imports: [Modal],
    });
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByRole('button', { name })).toBeVisible();
  });

  it('should display a dialog labeled with the given header text', async () => {
    const header = 'Test Header';
    await renderComponent({ inputs: { header } });
    expect(screen.getByText(header)).toBeVisible();
    expect(screen.getByRole('dialog', { name: header })).toBeVisible();
  });

  it('should have a close button with the given label', async () => {
    const closeAriaLabel = 'Close modal';
    await renderComponent({ inputs: { closeAriaLabel } });
    expect(screen.getByRole('button', { name: closeAriaLabel })).toBeVisible();
  });

  it('should emit lifecycle/interaction events', async () => {
    const visibilityChanged = vi.fn();
    const maximized = vi.fn();
    const hidden = vi.fn();
    const shown = vi.fn();
    const closeAriaLabel = 'Close modal';
    const actor = userEvent.setup();
    await renderComponent({
      on: { shown, hidden, maximized, visibilityChanged },
      inputs: { closeAriaLabel },
    });
    expect(shown).toHaveBeenCalledTimes(1);
    expect(hidden).toHaveBeenCalledTimes(0);
    expect(maximized).toHaveBeenCalledTimes(0);
    expect(visibilityChanged).toHaveBeenCalledTimes(0);
    await actor.click(screen.getByRole('button', { name: /maximize/i }));
    expect(maximized).toHaveBeenCalledTimes(1);
    expect(shown).toHaveBeenCalledTimes(1);
    expect(hidden).toHaveBeenCalledTimes(0);
    expect(visibilityChanged).toHaveBeenCalledTimes(0);
    await actor.click(screen.getByRole('button', { name: closeAriaLabel }));
    expect(visibilityChanged).toHaveBeenCalledTimes(1);
    expect(maximized).toHaveBeenCalledTimes(1);
    expect(hidden).toHaveBeenCalledTimes(1);
    expect(shown).toHaveBeenCalledTimes(1);
  });

  it('should add URL query parameter when shown', async () => {
    await renderComponent();
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(navigationSpy).toHaveBeenCalledTimes(1);
    expect(navigationSpy.mock.calls[0][0]).toStrictEqual(['.']);
    expect(navigationSpy.mock.calls[0][1]).toHaveProperty('relativeTo');
    expect(navigationSpy.mock.calls[0][1]).not.toHaveProperty('replaceUrl');
    expect(navigationSpy.mock.calls[0][1]).toHaveProperty('queryParams', {
      [Query_KEY]: Query_VALUE,
    });
  });

  it('should remove URL query parameter when hidden', async () => {
    const closeAriaLabel = 'Close modal';
    const actor = userEvent.setup();
    await renderComponent({ inputs: { closeAriaLabel } });
    navigationSpy.mockClear();
    await actor.click(screen.getByRole('button', { name: closeAriaLabel }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(navigationSpy).toHaveBeenCalledTimes(1);
    expect(navigationSpy.mock.calls[0][0]).toStrictEqual(['.']);
    expect(navigationSpy.mock.calls[0][1]).toHaveProperty('relativeTo');
    expect(navigationSpy.mock.calls[0][1]).not.toHaveProperty('queryParams');
    expect(navigationSpy.mock.calls[0][1]).toHaveProperty('replaceUrl', true);
  });

  it('should hide after a navigation without its query parameter', async () => {
    const name = 'Dummy Nav Link';
    const actor = userEvent.setup();
    await render(`<app-modal><a routerLink="/blah">${name}</a><</app-modal>`, {
      routes: [{ path: '**', component: class {} }],
      autoDetectChanges: false,
      imports: [Modal, RouterLink],
    });
    expect(screen.getByRole('dialog')).toBeVisible();
    await actor.click(screen.getByRole('link', { name }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
