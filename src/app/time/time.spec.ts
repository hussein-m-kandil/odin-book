import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { Time } from './time';

const renderComponent = ({ inputs, ...options }: RenderComponentOptions<Time> = {}) => {
  return render(Time, {
    inputs: { datetime: new Date(), ...inputs },
    autoDetectChanges: false,
    ...options,
  });
};

describe('Time', () => {
  it('should have the given datetime', async () => {
    const datetime = new Date().toISOString();
    await renderComponent({ inputs: { datetime: datetime } });
    expect(screen.getByRole('time')).toBeVisible();
    expect(screen.getByRole('time')).toHaveAttribute('datetime', datetime);
  });

  it('should display the word "Yesterday"', async () => {
    let datetime = new Date(Date.now() - (24 * 60 * 60 * 1000 + 1000));
    const { rerender } = await renderComponent({ inputs: { datetime: datetime } });
    expect(screen.getByText(/yesterday/i));
    datetime = new Date(Date.now() - (2 * 24 * 60 * 60 * 1000 - 1000));
    await rerender({ partialUpdate: true, inputs: { datetime } });
    expect(screen.getByText(/yesterday/i));
  });

  it('should not display the word "Yesterday"', async () => {
    let datetime = new Date();
    const { rerender } = await renderComponent({ inputs: { datetime: datetime } });
    expect(screen.queryByText(/yesterday/i)).toBeNull();
    datetime = new Date(Date.now() - (24 * 60 * 60 * 1000 - 1000));
    await rerender({ partialUpdate: true, inputs: { datetime } });
    expect(screen.queryByText(/yesterday/i)).toBeNull();
    datetime = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await rerender({ partialUpdate: true, inputs: { datetime } });
    expect(screen.queryByText(/yesterday/i)).toBeNull();
  });

  it('should have the given prefix', async () => {
    await renderComponent({ inputs: { prefix: '@ ' } });
    expect(screen.getByText(/^@ /i)).toBeVisible();
  });

  it('should have the given suffix', async () => {
    await renderComponent({ inputs: { suffix: ' @' } });
    expect(screen.getByText(/ @$/i)).toBeVisible();
  });

  it('should have the given classes', async () => {
    const { rerender } = await renderComponent({ inputs: { classes: 'foo bar' } });
    expect(screen.getByRole('time')).toHaveClass('foo', 'bar');
    await rerender({ partialUpdate: true, inputs: { classes: ['foo', 'bar'] } });
    expect(screen.getByRole('time')).toHaveClass('foo', 'bar');
    await rerender({ partialUpdate: true, inputs: { classes: { foo: false, bar: true } } });
    expect(screen.getByRole('time')).not.toHaveClass('foo');
    expect(screen.getByRole('time')).toHaveClass('bar');
  });

  it('should have the given classes', async () => {
    const { rerender } = await renderComponent({ inputs: { styles: 'width: 5px; height: 15px' } });
    expect(screen.getByRole('time')).toHaveStyle({ width: '5px', height: '15px' });
    await rerender({ partialUpdate: true, inputs: { styles: { width: '5px', height: '15px' } } });
    expect(screen.getByRole('time')).toHaveStyle({ width: '5px', height: '15px' });
  });
});
