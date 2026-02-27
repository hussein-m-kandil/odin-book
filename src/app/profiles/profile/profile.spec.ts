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

const toastMock = { add: vi.fn() };

const navigationSpy = vi.spyOn(Router.prototype, 'navigate');

const renderComponent = ({
  inputs,
  providers,
  ...options
}: RenderComponentOptions<Profile> = {}) => {
  return render(Profile, {
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

describe('Profile', () => {
  afterEach(vi.resetAllMocks);

  it('should render non-current, followed profile', async () => {
    profilesMock.isCurrentProfile.mockImplementation(() => false);
    await renderComponent({ inputs: { profile: { ...profile, followedByCurrentUser: true } } });
    expect(screen.getByRole('heading', { name: new RegExp(profile.user.fullname) })).toBeVisible();
    expect(screen.getByText(profile.user.username[0].toUpperCase())).toBeVisible();
    expect(screen.getByText(new RegExp(profile.user.username))).toBeVisible();
    expect(screen.getByText(new RegExp(profile.user.bio))).toBeVisible();
    expect(screen.queryByRole('switch', { name: /online/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^unfollow/i })).toBeVisible();
    expect(screen.queryByRole('button', { name: /^follow/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /followers/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /following/i })).toBeNull();
    expect(screen.getByRole('form', { name: /post/i })).toBeVisible();
  });

  it('should render non-current, non-followed profile', async () => {
    profilesMock.isCurrentProfile.mockImplementation(() => false);
    await renderComponent({ inputs: { profile: { ...profile, followedByCurrentUser: false } } });
    expect(screen.getByRole('heading', { name: new RegExp(profile.user.fullname) })).toBeVisible();
    expect(screen.getByText(profile.user.username[0].toUpperCase())).toBeVisible();
    expect(screen.getByText(new RegExp(profile.user.username))).toBeVisible();
    expect(screen.getByText(new RegExp(profile.user.bio))).toBeVisible();
    expect(screen.queryByRole('switch', { name: /online/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^follow/i })).toBeVisible();
    expect(screen.queryByRole('button', { name: /^unfollow/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /followers/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /following/i })).toBeNull();
    expect(screen.getByRole('form', { name: /post/i })).toBeVisible();
  });

  it('should render the current profile data', async () => {
    profilesMock.isCurrentProfile.mockImplementation(() => true);
    await renderComponent();
    expect(screen.getByRole('heading', { name: new RegExp(profile.user.fullname) })).toBeVisible();
    expect(screen.getByText(profile.user.username[0].toUpperCase())).toBeVisible();
    expect(screen.getByText(new RegExp(profile.user.username))).toBeVisible();
    expect(screen.getByText(new RegExp(profile.user.bio))).toBeVisible();
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
    expect(screen.queryByRole('switch', { name: /online/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^unfollow/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^follow/i })).toBeNull();
    expect(screen.getByRole('link', { name: /followers/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /following/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /followers/i })).toHaveAttribute('href', '/followers');
    expect(screen.getByRole('link', { name: /following/i })).toHaveAttribute('href', '/following');
    expect(screen.getByRole('form', { name: /post/i })).toBeVisible();
  });

  it('should render a delete-picture option', async () => {
    profilesMock.isCurrentProfile.mockImplementation(() => true);
    const testProfile = {
      ...profile,
      user: { ...user, avatar: { image: { id: crypto.randomUUID() } } },
    } as unknown as typeof profile;
    await renderComponent({ inputs: { profile: testProfile } });
    expect(screen.getByRole('link', { name: /edit profile/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /edit profile/i })).toHaveAttribute('href', '/edit');
    expect(screen.getByRole('link', { name: /delete picture/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /delete picture/i })).toHaveAttribute(
      'href',
      `/pic/${testProfile.user.avatar!.image.id}/delete`,
    );
    expect(screen.queryByRole('link', { name: /upload picture/i })).toBeNull();
    expect(screen.getByRole('link', { name: /delete profile/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /delete profile/i })).toHaveAttribute(
      'href',
      '/delete',
    );
  });

  it('should toggle online status', async () => {
    let sub!: Subscriber<unknown>;
    const actor = userEvent.setup();
    profilesMock.isCurrentProfile.mockImplementation(() => true);
    profilesMock.updateCurrentProfile.mockImplementation(() => new Observable((s) => (sub = s)));
    const { detectChanges } = await renderComponent();
    const propertySwitch = screen.getByRole('switch', { name: /online/i });
    expect(propertySwitch).toBeEnabled();
    await actor.click(propertySwitch);
    expect(propertySwitch).toBeEnabled();
    sub.next(profile);
    sub.complete();
    detectChanges();
    expect(propertySwitch).toBeEnabled();
    expect(navigationSpy).toHaveBeenCalledTimes(0);
    expect(profilesMock.updateCurrentProfile).toHaveBeenCalledExactlyOnceWith({
      visible: !profile.visible,
    });
  });

  it('should fail to toggle online status', async () => {
    let sub!: Subscriber<unknown>;
    const actor = userEvent.setup();
    profilesMock.isCurrentProfile.mockImplementation(() => true);
    profilesMock.updateCurrentProfile.mockImplementation(() => new Observable((s) => (sub = s)));
    const { detectChanges } = await renderComponent();
    const propertySwitch = screen.getByRole('switch', { name: /online/i });
    expect(propertySwitch).toBeEnabled();
    await actor.click(propertySwitch);
    expect(propertySwitch).toBeEnabled();
    sub.error(new ProgressEvent('Network error'));
    detectChanges();
    expect(propertySwitch).toBeEnabled();
    expect(navigationSpy).toHaveBeenCalledTimes(0);
    expect(profilesMock.updateCurrentProfile).toHaveBeenCalledExactlyOnceWith({
      visible: !profile.visible,
    });
  });
});
