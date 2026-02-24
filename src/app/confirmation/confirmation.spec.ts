import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { Confirmation } from './confirmation';

const renderComponent = (options: RenderComponentOptions<Confirmation> = {}) => {
  return render(Confirmation, { autoDetectChanges: false, ...options });
};

describe('Confirmation', () => {
  it('should display a form that labelled by the given element id and has the projected children', async () => {
    await render(
      `
      <app-confirmation ariaLabelledBy="label" [accept]="{ severity: 'danger', label: 'Delete' }"
                        [reject]="{ severity: 'secondary', label: 'Cancel' }">
        <p id="label">Test Child</p>
      </app-confirmation>
      `,
      { imports: [Confirmation], autoDetectChanges: false },
    );
    expect(screen.getByRole('form', { name: 'Test Child' })).toBeVisible();
    expect(screen.getByText('Test Child')).toBeVisible();
  });

  it('should display only a confirmation form that not emit any events without interaction', async () => {
    const accepted = vi.fn();
    const rejected = vi.fn();
    await renderComponent({ on: { accepted, rejected } });
    expect(screen.getByRole('form', { name: /confirmation/i })).toBeVisible();
    expect(screen.queryByRole('button')).toBeNull();
    expect(accepted).toHaveBeenCalledTimes(0);
    expect(rejected).toHaveBeenCalledTimes(0);
  });

  it('should display an acceptance button', async () => {
    const accept = { severity: 'success' as const, label: 'Yes!' };
    await renderComponent({ inputs: { accept } });
    expect(screen.getByRole('button', { name: accept.label })).toBeVisible();
  });

  it('should display a disabled acceptance button', async () => {
    const accept = { severity: 'success' as const, label: 'Yes!', disabled: true };
    const reject = { severity: 'secondary' as const, label: 'No!' };
    await renderComponent({ inputs: { accept, reject } });
    expect(screen.getByRole('button', { name: accept.label })).toBeDisabled();
    expect(screen.getByRole('button', { name: reject.label })).toBeEnabled();
  });

  it('should display a disabled accepting button', async () => {
    const accept = { severity: 'success' as const, label: 'Yes!', loading: true };
    const reject = { severity: 'secondary' as const, label: 'No!' };
    await renderComponent({ inputs: { accept, reject } });
    expect(screen.getByRole('button', { name: accept.label })).toBeDisabled();
    expect(screen.getByRole('button', { name: accept.label })).toHaveClass('p-button-loading');
    expect(screen.getByRole('button', { name: reject.label })).not.toHaveClass('p-button-loading');
    expect(screen.getByRole('button', { name: reject.label })).toBeDisabled();
  });

  it('should display a rejection button', async () => {
    const reject = { severity: 'secondary' as const, label: 'No!' };
    await renderComponent({ inputs: { reject } });
    expect(screen.getByRole('button', { name: reject.label })).toBeVisible();
  });

  it('should display a disabled rejection button', async () => {
    const accept = { severity: 'success' as const, label: 'Yes!' };
    const reject = { severity: 'secondary' as const, label: 'No!', disabled: true };
    await renderComponent({ inputs: { accept, reject } });
    expect(screen.getByRole('button', { name: accept.label })).toBeEnabled();
    expect(screen.getByRole('button', { name: reject.label })).toBeDisabled();
  });

  it('should display a disabled rejecting button', async () => {
    const accept = { severity: 'success' as const, label: 'Yes!' };
    const reject = { severity: 'secondary' as const, label: 'No!', loading: true };
    await renderComponent({ inputs: { accept, reject } });
    expect(screen.getByRole('button', { name: reject.label })).toBeDisabled();
    expect(screen.getByRole('button', { name: reject.label })).toHaveClass('p-button-loading');
    expect(screen.getByRole('button', { name: accept.label })).not.toHaveClass('p-button-loading');
    expect(screen.getByRole('button', { name: accept.label })).toBeDisabled();
  });

  it('should accept', async () => {
    const accept = { severity: 'success' as const, label: 'Yes!' };
    const accepted = vi.fn();
    const rejected = vi.fn();
    const actor = userEvent.setup();
    await renderComponent({ inputs: { accept }, on: { accepted, rejected } });
    await actor.click(screen.getByRole('button', { name: accept.label }));
    expect(accepted).toHaveBeenCalledTimes(1);
    expect(rejected).toHaveBeenCalledTimes(0);
  });

  it('should reject', async () => {
    const reject = { severity: 'secondary' as const, label: 'No!' };
    const accepted = vi.fn();
    const rejected = vi.fn();
    const actor = userEvent.setup();
    await renderComponent({ inputs: { reject }, on: { accepted, rejected } });
    await actor.click(screen.getByRole('button', { name: reject.label }));
    expect(accepted).toHaveBeenCalledTimes(0);
    expect(rejected).toHaveBeenCalledTimes(1);
  });
});
