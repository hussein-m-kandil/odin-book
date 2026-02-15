import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { environment } from '../environments';
import { App } from './app';
import { Auth } from './auth/auth';
import { AppStorage } from './app-storage';

const user = {
  profile: { id: crypto.randomUUID() },
  id: crypto.randomUUID(),
  username: 'test_user',
  fullname: 'Test User',
  bio: 'Test bio.',
};

const authMock = { user: vi.fn(() => user), userSignedOut: { subscribe: vi.fn() } };

const storageMock = { getItem: vi.fn(() => 'value'), setItem: vi.fn() };

const renderComponent = ({ providers, ...options }: RenderComponentOptions<App> = {}) => {
  return render(App, {
    providers: [
      { provide: AppStorage, useValue: storageMock },
      { provide: Auth, useValue: authMock },
      ...(providers || []),
    ],
    autoDetectChanges: false,
    ...options,
  });
};

describe('App', () => {
  it('should render title', async () => {
    await renderComponent();
    expect(screen.getByRole('heading', { name: new RegExp(environment.title, 'i') })).toBeVisible();
  });
});
