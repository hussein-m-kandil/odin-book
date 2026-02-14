import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { environment } from '../environments';
import { App } from './app';

const renderComponent = (options: RenderComponentOptions<App> = {}) => {
  return render(App, options);
};

console.log('API URL: ', environment.apiUrl);

describe('App', () => {
  it('should render title', async () => {
    await renderComponent();
    expect(screen.getByRole('heading', { name: new RegExp(environment.title, 'i') })).toBeVisible();
  });
});
