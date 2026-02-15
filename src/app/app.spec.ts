import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { AppStorage } from './app-storage';
import { Component } from '@angular/core';
import { Navigation } from './navigation';
import { Profiles } from './profiles';
import { Auth } from './auth/auth';
import { App } from './app';
import { of } from 'rxjs';

const resolve = { testData: vi.fn(() => of(null)) };

@Component({ selector: 'app-follower-list', template: `<div>{{ title }}</div>` })
class FollowerListMock {
  static TITLE = 'Test Follower List';
  protected title = FollowerListMock.TITLE;
}
@Component({ selector: 'app-profile-list', template: `<div>{{ title }}</div>` })
class ProfileListMock {
  static TITLE = 'Test Profile List';
  protected title = ProfileListMock.TITLE;
}

const testRoutes = [
  {
    path: '',
    resolve,
    children: [
      { path: 'followers', component: FollowerListMock },
      { path: 'profiles', component: ProfileListMock },
    ],
  },
];

const user = {
  profile: { id: crypto.randomUUID() },
  id: crypto.randomUUID(),
  username: 'test_user',
  fullname: 'Test User',
  bio: 'Test bio.',
};

const authMock = { user: vi.fn(() => user), userSignedOut: { subscribe: vi.fn() } };
const navigationMock = { isInitial: vi.fn(), navigating: vi.fn(), error: vi.fn() };
const profilesMock = { reset: vi.fn(), profileUpdated: { subscribe: vi.fn() } };
const storageMock = { getItem: vi.fn(() => 'value'), setItem: vi.fn() };

const renderComponent = ({
  routes,
  providers,
  initialRoute,
  ...options
}: RenderComponentOptions<App> = {}) => {
  return render(App, {
    providers: [
      { provide: Navigation, useValue: navigationMock },
      { provide: AppStorage, useValue: storageMock },
      { provide: Profiles, useValue: profilesMock },
      { provide: Auth, useValue: authMock },
      ...(providers || []),
    ],
    initialRoute: initialRoute || '/profiles',
    routes: routes || testRoutes,
    autoDetectChanges: false,
    ...options,
  });
};

describe('App', () => {
  afterEach(vi.resetAllMocks);

  it('should display the profile list', async () => {
    await renderComponent({ initialRoute: '/profiles' });
    expect(screen.getByText(ProfileListMock.TITLE)).toBeVisible();
    expect(screen.getByRole('link', { name: /followers/i })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: /profiles/i })).toHaveAttribute('aria-current', 'page');
  });

  it('should display the follower list', async () => {
    await renderComponent({ initialRoute: '/followers' });
    expect(screen.getByText(FollowerListMock.TITLE)).toBeVisible();
    expect(screen.getByRole('link', { name: /profiles/i })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: /followers/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('should navigate to `/profiles`', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: '/followers' });
    await user.click(screen.getByRole('link', { name: /profiles/i }));
    await vi.waitFor(() => expect(screen.getByText(ProfileListMock.TITLE)).toBeVisible());
    expect(screen.getByRole('link', { name: /followers/i })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: /profiles/i })).toHaveAttribute('aria-current', 'page');
  });

  it('should navigate to `/followers`', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: '/profiles' });
    await user.click(screen.getByRole('link', { name: /followers/i }));
    await vi.waitFor(() => expect(screen.getByText(FollowerListMock.TITLE)).toBeVisible());
    expect(screen.getByRole('link', { name: /profiles/i })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: /followers/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  const urls = ['/profiles', '/followers'];

  for (const initialRoute of urls) {
    it('should show loader on initial navigation', async () => {
      navigationMock.navigating.mockImplementation(() => true);
      navigationMock.isInitial.mockImplementation(() => true);
      await renderComponent({ initialRoute });
      expect(screen.getByLabelText(/loading/i)).toBeVisible();
      expect(screen.queryByText(ProfileListMock.TITLE)).toBeNull();
    });

    it('should show loader on non-initial navigation', async () => {
      navigationMock.navigating.mockImplementation(() => true);
      navigationMock.isInitial.mockImplementation(() => false);
      await renderComponent({ initialRoute });
      expect(screen.getByLabelText(/loading/i)).toBeVisible();
      expect(screen.queryByText(ProfileListMock.TITLE)).toBeNull();
    });

    it('should display an initial navigation error message and a retry button', async () => {
      const error = { message: 'Test navigation error', url: '/' };
      navigationMock.isInitial.mockImplementation(() => true);
      navigationMock.error.mockImplementation(() => error);
      await renderComponent({ initialRoute });
      expect(screen.getByText(error.message));
      expect(screen.getByRole('button', { name: /retry/i }));
      expect(screen.queryByText(ProfileListMock.TITLE)).toBeNull();
      expect(screen.queryByLabelText(/loading/i)).toBeNull();
    });

    it('should display a non-initial navigation error message and a retry button', async () => {
      const error = { message: 'Test navigation error', url: '/' };
      navigationMock.error.mockImplementation(() => error);
      await renderComponent({ initialRoute });
      expect(screen.getByText(error.message));
      expect(screen.getByRole('button', { name: /retry/i }));
      expect(screen.queryByText(ProfileListMock.TITLE)).toBeNull();
      expect(screen.queryByLabelText(/loading/i)).toBeNull();
    });

    it('should reset app state when the user signed out', async () => {
      authMock.userSignedOut.subscribe.mockImplementation((resetter) => resetter());
      await renderComponent({ initialRoute });
      expect(profilesMock.reset).toHaveBeenCalledTimes(1);
      expect(authMock.userSignedOut.subscribe).toHaveBeenCalledTimes(1);
    });
  }
});
