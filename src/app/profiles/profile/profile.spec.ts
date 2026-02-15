import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { Profile as ProfileT, User } from '../../app.types';
import { userEvent } from '@testing-library/user-event';
import { of, Subscriber, Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { Profiles } from '../profiles';
import { Profile } from './profile';

const user = {
  id: crypto.randomUUID(),
  username: 'test_user',
  fullname: 'Test User',
  bio: 'Test bio.',
} as User;

const profile: ProfileT = {
  id: crypto.randomUUID(),
  user,
  visible: true,
  tangible: true,
  followedByCurrentUser: false,
  lastSeen: new Date().toISOString(),
};

user.profile = profile;

const profilesMock = {
  isOnline: vi.fn(() => of(true)),
  list: vi.fn(() => [] as ProfileT[]),
  isCurrentProfile: vi.fn(() => false),
  profileUpdated: { subscribe: vi.fn() },
  toggleFollowing: vi.fn(() => of(profile)),
  updateCurrentProfile: vi.fn(() => of(profile)),
};

const navigationSpy = vi.spyOn(Router.prototype, 'navigate');

const renderComponent = ({
  inputs,
  providers,
  ...options
}: RenderComponentOptions<Profile> = {}) => {
  return render(Profile, {
    providers: [
      { provide: Profiles, useValue: profilesMock },
      MessageService,
      ...(providers || []),
    ],
    inputs: { profile, ...inputs },
    autoDetectChanges: false,
    ...options,
  });
};

const assertBtnsEnabled = (...extraNodes: Node[]) => {
  expect(screen.getByRole('button', { name: /back/i })).toBeEnabled();
  for (const node of extraNodes) expect(node).toBeEnabled();
};

describe('Profile', () => {
  afterEach(vi.resetAllMocks);

  it('should render non-current, followed profile', async () => {
    profilesMock.isCurrentProfile.mockImplementation(() => false);
    await renderComponent({ inputs: { profile: { ...profile, followedByCurrentUser: true } } });
    expect(screen.getByRole('heading', { name: new RegExp(profile.user.fullname) })).toBeVisible();
    expect(screen.getByText(profile.user.username[0].toUpperCase())).toBeVisible();
    expect(screen.getByText(new RegExp(profile.user.username))).toBeVisible();
    expect(screen.getByText(new RegExp(profile.user.bio))).toBeVisible();
    expect(screen.getByRole('button', { name: /back/i })).toBeVisible();
    expect(screen.queryByRole('button', { name: /toggle profile options/i })).toBeNull();
    expect(screen.queryByRole('switch', { name: /active status/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^unfollow/i })).toBeVisible();
    expect(screen.queryByRole('button', { name: /^follow/i })).toBeNull();
  });

  it('should render non-current, non-followed profile', async () => {
    profilesMock.isCurrentProfile.mockImplementation(() => false);
    await renderComponent({ inputs: { profile: { ...profile, followedByCurrentUser: false } } });
    expect(screen.getByRole('heading', { name: new RegExp(profile.user.fullname) })).toBeVisible();
    expect(screen.getByText(profile.user.username[0].toUpperCase())).toBeVisible();
    expect(screen.getByText(new RegExp(profile.user.username))).toBeVisible();
    expect(screen.getByText(new RegExp(profile.user.bio))).toBeVisible();
    expect(screen.getByRole('button', { name: /back/i })).toBeVisible();
    expect(screen.queryByRole('button', { name: /toggle profile options/i })).toBeNull();
    expect(screen.queryByRole('switch', { name: /active status/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^follow/i })).toBeVisible();
    expect(screen.queryByRole('button', { name: /^unfollow/i })).toBeNull();
  });

  it('should render the current profile data', async () => {
    profilesMock.isCurrentProfile.mockImplementation(() => true);
    await renderComponent();
    expect(screen.getByRole('heading', { name: new RegExp(profile.user.fullname) })).toBeVisible();
    expect(screen.getByText(profile.user.username[0].toUpperCase())).toBeVisible();
    expect(screen.getByText(new RegExp(profile.user.username))).toBeVisible();
    expect(screen.getByText(new RegExp(profile.user.bio))).toBeVisible();
    expect(screen.getByRole('button', { name: /back/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /toggle profile options/i })).toBeVisible();
    expect(screen.queryByRole('switch', { name: /active status/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^unfollow/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^follow/i })).toBeNull();
  });

  it('should render a button that toggles the current profile options menu', async () => {
    profilesMock.isCurrentProfile.mockImplementation(() => true);
    const actor = userEvent.setup();
    await renderComponent();
    await actor.click(screen.getByRole('button', { name: /toggle profile options/i }));
    await vi.waitFor(() =>
      expect(screen.getByRole('menu', { name: /profile options/i })).toBeVisible(),
    );
    expect(screen.getByRole('link', { name: /edit profile/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /edit profile/i })).toHaveAttribute('href', '/edit');
    expect(screen.getByRole('link', { name: /upload picture/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /upload picture/i })).toHaveAttribute('href', '/pic');
    expect(screen.getByRole('link', { name: /delete profile/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /delete profile/i })).toHaveAttribute(
      'href',
      '/delete',
    );
    expect(screen.queryByRole('link', { name: /delete picture/i })).toBeNull();
    await actor.click(screen.getByRole('button', { name: /toggle profile options/i }));
    await vi.waitFor(() =>
      expect(screen.queryByRole('menu', { name: /profile options/i })).toBeNull(),
    );
    expect(screen.queryByRole('link', { name: /edit profile/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /upload picture/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /delete profile/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /delete picture/i })).toBeNull();
  });

  it('should render a delete-picture option', async () => {
    profilesMock.isCurrentProfile.mockImplementation(() => true);
    const actor = userEvent.setup();
    const testProfile = {
      ...profile,
      user: { ...user, avatar: { image: { id: crypto.randomUUID() } } },
    } as unknown as typeof profile;
    await renderComponent({ inputs: { profile: testProfile } });
    await actor.click(screen.getByRole('button', { name: /toggle profile options/i }));
    await vi.waitFor(() =>
      expect(screen.getByRole('menu', { name: /profile options/i })).toBeVisible(),
    );
    expect(screen.getByRole('link', { name: /edit profile/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /edit profile/i })).toHaveAttribute('href', '/edit');
    expect(screen.getByRole('link', { name: /upload picture/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /upload picture/i })).toHaveAttribute('href', '/pic');
    expect(screen.getByRole('link', { name: /delete profile/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /delete profile/i })).toHaveAttribute(
      'href',
      '/delete',
    );
    expect(screen.getByRole('link', { name: /delete picture/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /delete picture/i })).toHaveAttribute(
      'href',
      `/pic/${testProfile.user.avatar!.image.id}/delete`,
    );
    await actor.click(screen.getByRole('button', { name: /toggle profile options/i }));
    await vi.waitFor(() =>
      expect(screen.queryByRole('menu', { name: /profile options/i })).toBeNull(),
    );
    expect(screen.queryByRole('link', { name: /edit profile/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /upload picture/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /delete profile/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /delete picture/i })).toBeNull();
  });

  it('should toggle active status', async () => {
    let sub!: Subscriber<unknown>;
    const actor = userEvent.setup();
    profilesMock.isCurrentProfile.mockImplementation(() => true);
    profilesMock.updateCurrentProfile.mockImplementation(() => new Observable((s) => (sub = s)));
    const { detectChanges } = await renderComponent();
    const propertySwitch = screen.getByRole('switch', { name: /active status/i });
    assertBtnsEnabled(propertySwitch);
    await actor.click(propertySwitch);
    assertBtnsEnabled(propertySwitch);
    sub.next(profile);
    sub.complete();
    detectChanges();
    assertBtnsEnabled(propertySwitch);
    expect(navigationSpy).toHaveBeenCalledTimes(0);
    expect(profilesMock.updateCurrentProfile).toHaveBeenCalledExactlyOnceWith({
      visible: !profile.visible,
    });
  });

  it('should fail to toggle active status', async () => {
    let sub!: Subscriber<unknown>;
    const actor = userEvent.setup();
    profilesMock.isCurrentProfile.mockImplementation(() => true);
    profilesMock.updateCurrentProfile.mockImplementation(() => new Observable((s) => (sub = s)));
    const { detectChanges } = await renderComponent();
    const propertySwitch = screen.getByRole('switch', { name: /active status/i });
    assertBtnsEnabled(propertySwitch);
    await actor.click(propertySwitch);
    assertBtnsEnabled(propertySwitch);
    sub.error(new ProgressEvent('Network error'));
    detectChanges();
    assertBtnsEnabled(propertySwitch);
    expect(navigationSpy).toHaveBeenCalledTimes(0);
    expect(profilesMock.updateCurrentProfile).toHaveBeenCalledExactlyOnceWith({
      visible: !profile.visible,
    });
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
      assertBtnsEnabled();
      await actor.click(followBtn);
      assertBtnsEnabled();
      expect(followBtn).toBeDisabled();
      sub.next(profile);
      sub.complete();
      detectChanges();
      assertBtnsEnabled(followBtn);
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
      assertBtnsEnabled(followBtn);
      await actor.click(followBtn);
      assertBtnsEnabled();
      expect(followBtn).toBeDisabled();
      sub.error(new ProgressEvent('Network error'));
      detectChanges();
      assertBtnsEnabled(followBtn);
      expect(navigationSpy).toHaveBeenCalledTimes(0);
      expect(profilesMock.toggleFollowing).toHaveBeenCalledExactlyOnceWith(testProfile);
    });
  }
});
