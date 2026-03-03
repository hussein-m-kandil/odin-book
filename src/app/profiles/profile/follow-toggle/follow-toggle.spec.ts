import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { Profile, User } from '../../../app.types';
import { Observable, of, Subscriber } from 'rxjs';
import { FollowToggle } from './follow-toggle';
import { MessageService } from 'primeng/api';
import { Profiles } from '../../profiles';
import { Router } from '@angular/router';

const user = {
  id: crypto.randomUUID(),
  username: 'test_user',
  fullname: 'Test User',
  bio: 'Test bio.',
} as User;

const profile: Profile = {
  id: crypto.randomUUID(),
  user,
  visible: true,
  tangible: true,
  userId: user.id,
  followedByCurrentUser: false,
  lastSeen: new Date().toISOString(),
};

user.profile = profile;

const profilesMock = {
  isOnline: vi.fn(() => of(true)),
  list: vi.fn(() => [] as Profile[]),
  isCurrentProfile: vi.fn(() => false),
  profileUpdated: { subscribe: vi.fn() },
  toggleFollowing: vi.fn(() => of(profile)),
  updateCurrentProfile: vi.fn(() => of(profile)),
};

const toastMock = { add: vi.fn() };

const navigationSpy = vi.spyOn(Router.prototype, 'navigate');

const renderComponent = ({
  providers,
  inputs,
  ...options
}: RenderComponentOptions<FollowToggle> = {}) => {
  return render(FollowToggle, {
    providers: [
      { provide: MessageService, useValue: toastMock },
      { provide: Profiles, useValue: profilesMock },
      ...(providers || []),
    ],
    inputs: { profile, ...inputs },
    autoDetectChanges: false,
    ...options,
  });
};

describe('FollowToggle', () => {
  afterEach(vi.resetAllMocks);

  it('should render nothing for the profile of the current user', async () => {
    profilesMock.isCurrentProfile.mockImplementation(() => true);
    const { container } = await renderComponent();
    expect(screen.queryByRole('button', { name: /^unfollow/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^follow/i })).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it('should render follow button', async () => {
    await renderComponent({ inputs: { profile: { ...profile, followedByCurrentUser: false } } });
    expect(screen.queryByRole('button', { name: /^follow/i })).toBeVisible();
    expect(screen.queryByRole('button', { name: /^unfollow/i })).toBeNull();
  });

  it('should render unfollow button', async () => {
    await renderComponent({ inputs: { profile: { ...profile, followedByCurrentUser: true } } });
    expect(screen.queryByRole('button', { name: /^unfollow/i })).toBeVisible();
    expect(screen.queryByRole('button', { name: /^follow/i })).toBeNull();
  });

  const followingTestData = [
    { action: 'follow' as const, followedByCurrentUser: false },
    { action: 'unfollow' as const, followedByCurrentUser: true },
  ];

  for (const { action, followedByCurrentUser } of followingTestData) {
    it(`should ${action}`, async () => {
      let sub!: Subscriber<unknown>;
      const actor = userEvent.setup();
      profilesMock.isCurrentProfile.mockImplementation(() => false);
      profilesMock.toggleFollowing.mockImplementation(() => new Observable((s) => (sub = s)));
      const testProfile = { ...profile, followedByCurrentUser };
      const { detectChanges } = await renderComponent({ inputs: { profile: testProfile } });
      const followBtn = screen.getByRole('button', { name: new RegExp(`^${action}`, 'i') });
      await actor.click(followBtn);
      expect(followBtn).toBeDisabled();
      sub.next(profile);
      sub.complete();
      detectChanges();
      expect(followBtn).toBeEnabled();
      expect(navigationSpy).toHaveBeenCalledTimes(0);
      expect(profilesMock.toggleFollowing).toHaveBeenCalledExactlyOnceWith(testProfile);
    });

    it(`should fail to ${action}`, async () => {
      let sub!: Subscriber<unknown>;
      const actor = userEvent.setup();
      profilesMock.isCurrentProfile.mockImplementation(() => false);
      profilesMock.toggleFollowing.mockImplementation(() => new Observable((s) => (sub = s)));
      const testProfile = { ...profile, followedByCurrentUser };
      const { detectChanges } = await renderComponent({ inputs: { profile: testProfile } });
      const followBtn = screen.getByRole('button', { name: new RegExp(`^${action}`, 'i') });
      expect(followBtn).toBeEnabled();
      await actor.click(followBtn);
      expect(followBtn).toBeDisabled();
      sub.error(new ProgressEvent('Network error'));
      detectChanges();
      expect(followBtn).toBeEnabled();
      expect(navigationSpy).toHaveBeenCalledTimes(0);
      expect(profilesMock.toggleFollowing).toHaveBeenCalledExactlyOnceWith(testProfile);
    });
  }
});
