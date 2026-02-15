import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { AppStorage } from './app-storage';
import { Component } from '@angular/core';
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
@Component({ selector: 'app-following-list', template: `<div>{{ title }}</div>` })
class FollowingListMock {
  static TITLE = 'Test Following List';
  protected title = FollowingListMock.TITLE;
}

const testRoutes = [
  {
    path: '',
    resolve,
    children: [
      { path: 'followers', component: FollowerListMock },
      { path: 'following', component: FollowingListMock },
      {
        path: 'profiles',
        children: [
          { path: '', component: ProfileListMock },
          { path: ':profileId', component: FollowingListMock },
        ],
      },
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

  it('should display the following list', async () => {
    await renderComponent({ initialRoute: '/following' });
    expect(screen.getByText(FollowingListMock.TITLE)).toBeVisible();
    expect(screen.getByRole('link', { name: /profiles/i })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: /following/i })).toHaveAttribute(
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

  it('should navigate to `/following`', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: '/profiles' });
    await user.click(screen.getByRole('link', { name: /following/i }));
    await vi.waitFor(() => expect(screen.getByText(FollowingListMock.TITLE)).toBeVisible());
    expect(screen.getByRole('link', { name: /profiles/i })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: /following/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  const urls = ['/profiles', '/profiles/test-profile-id', '/followers', 'following'];
  for (const initialRoute of urls) {
    it('should reset app state when the user signed out', async () => {
      authMock.userSignedOut.subscribe.mockImplementation((resetter) => resetter());
      await renderComponent({ initialRoute });
      expect(profilesMock.reset).toHaveBeenCalledTimes(1);
      expect(authMock.userSignedOut.subscribe).toHaveBeenCalledTimes(1);
    });
  }
});
