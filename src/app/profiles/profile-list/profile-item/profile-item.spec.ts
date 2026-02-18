import { render, screen, RenderComponentOptions } from '@testing-library/angular';
import { MessageService } from 'primeng/api';
import { ProfileItem } from './profile-item';
import { Profile } from '../../../app.types';

const profile = { id: crypto.randomUUID(), user: { username: 'test_user_01' } } as Profile;

const renderComponent = ({
  providers,
  inputs,
  ...options
}: RenderComponentOptions<ProfileItem> = {}) => {
  return render(ProfileItem, {
    providers: [{ provide: MessageService, useValue: { add: vi.fn() } }, ...(providers || [])],
    inputs: { profile, ...inputs },
    autoDetectChanges: false,
    ...options,
  });
};

describe('ProfileItem', () => {
  it('should display a profile item', async () => {
    await renderComponent();
    const username = profile.user.username;
    const name = new RegExp(username);
    const profileLink = screen.getByRole('link', { name });
    expect(screen.getByRole('img', { name })).toBeVisible();
    expect(profileLink).toHaveAttribute('href', `/profiles/${username}`);
    expect(screen.getByRole('button', { name: /follow/i })).toBeVisible();
  });
});
