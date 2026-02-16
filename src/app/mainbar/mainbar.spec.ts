import { render, screen, RenderComponentOptions } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { ColorScheme, SCHEMES } from '../color-scheme';
import { environment } from '../../environments';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { Profiles } from '../profiles';
import { Mainbar } from './mainbar';
import { Auth } from '../auth';
import { of } from 'rxjs';

const navigationSpy = vi.spyOn(Router.prototype, 'navigateByUrl');

const user = {
  profile: { id: crypto.randomUUID() },
  id: crypto.randomUUID(),
  username: 'test_user',
  fullname: 'Test User',
  bio: 'Test bio.',
};

const authMock = { user: vi.fn(() => user as unknown), signOut: vi.fn(), socket: { on: vi.fn() } };

const colorSchemeMock = {
  selectedScheme: vi.fn(() => SCHEMES[1] as unknown),
  switch: vi.fn(),
  select: vi.fn(),
};

const profilesMock = {
  isOnline: vi.fn(() => of(false)),
  isCurrentProfile: vi.fn(() => false),
  profileUpdated: { subscribe: vi.fn() },
};

const renderComponent = ({ providers, ...options }: RenderComponentOptions<Mainbar> = {}) => {
  return render(Mainbar, {
    providers: [
      MessageService,
      { provide: Auth, useValue: authMock },
      { provide: Profiles, useValue: profilesMock },
      { provide: ColorScheme, useValue: colorSchemeMock },
      ...(providers || []),
    ],
    routes: [{ path: '**', component: class {} }],
    autoDetectChanges: false,
    ...options,
  });
};

describe('Mainbar', () => {
  afterEach(vi.resetAllMocks);

  it('should render the app title', async () => {
    await renderComponent();
    const name = new RegExp(environment.title, 'i');
    const heading = screen.getByRole('heading', { name });
    const link = screen.getByRole('link', { name });
    expect(link).toHaveAttribute('href', '/');
    expect(heading).toContainElement(link);
    expect(heading).toBeVisible();
    expect(link).toBeVisible();
  });

  it('should have a link to the profile page', async () => {
    await renderComponent();
    const profilesLink = screen.getByRole('link', { name: /profiles/i });
    expect(profilesLink).toBeVisible();
    expect(profilesLink).toHaveAttribute('href', '/profiles');
  });

  it('should have a color-scheme toggler that indicates to the selected value', async () => {
    colorSchemeMock.selectedScheme.mockImplementation(() => SCHEMES[2]);
    await renderComponent();
    expect(
      screen.getByRole('button', {
        name: new RegExp(`change .*${SCHEMES[2].value}.* color scheme`, 'i'),
      }),
    ).toBeVisible();
  });

  it('should show the color-scheme menu after clicking its toggler', async () => {
    authMock.user.mockImplementation(() => user);
    const { click } = userEvent.setup();
    await renderComponent();
    await click(screen.getByRole('button', { name: /change .* color scheme/i }));
    let colorSchemeMenu!: HTMLElement;
    await vi.waitFor(() => (colorSchemeMenu = screen.getByRole('menu', { name: /color scheme/i })));
    for (const { value } of SCHEMES) {
      const colorSchemeMenuItem = screen.getByRole('menuitem', { name: new RegExp(value, 'i') });
      expect(colorSchemeMenu).toContainElement(colorSchemeMenuItem);
      expect(colorSchemeMenuItem).toBeVisible();
    }
  });

  it('should change the color-scheme', async () => {
    authMock.user.mockImplementation(() => user);
    const { click } = userEvent.setup();
    await renderComponent();
    for (let i = 0; i < SCHEMES.length; i++) {
      const scheme = SCHEMES[i];
      await click(screen.getByRole('button', { name: /change .* color scheme/i }));
      await vi.waitFor(() =>
        expect(screen.getByRole('menu', { name: /color scheme/i })).toBeVisible(),
      );
      await click(screen.getByText(new RegExp(scheme.value, 'i')));
      await vi.waitFor(() =>
        expect(screen.queryByRole('menu', { name: /color scheme/i })).toBeNull(),
      );
      expect(colorSchemeMock.select).toHaveBeenNthCalledWith(i + 1, scheme);
    }
    expect(colorSchemeMock.switch).toHaveBeenCalledTimes(0);
  });

  it('should not have a profile toggler/menu if the user is unauthenticated', async () => {
    authMock.user.mockImplementation(() => null);
    await renderComponent();
    expect(screen.queryByRole('button', { name: /toggle profile menu/i })).toBeNull();
    expect(screen.queryByRole('menu', { name: /profile/i })).toBeNull();
  });

  it('should have a profile toggler/menu if the user is authenticated', async () => {
    authMock.user.mockImplementation(() => user);
    await renderComponent();
    expect(screen.getByRole('button', { name: /toggle profile menu/i })).toBeVisible();
    expect(screen.queryByRole('menu', { name: /profile/i })).toBeNull();
  });

  it('should show the profile menu after clicking its toggler', async () => {
    authMock.user.mockImplementation(() => user);
    const { click } = userEvent.setup();
    await renderComponent();
    await click(screen.getByRole('button', { name: /toggle profile menu/i }));
    let profileMenu!: HTMLElement;
    await vi.waitFor(() => (profileMenu = screen.getByRole('menu', { name: /profile/i })));
    const profileLink = screen.getByRole('link', { name: new RegExp(user.username, 'i') });
    const signoutBtn = screen.getByRole('menuitem', { name: /sign ?out/i });
    expect(profileMenu).toContainElement(signoutBtn);
    expect(profileMenu).toContainElement(profileLink);
    expect(profileLink).toBeInstanceOf(HTMLAnchorElement);
    expect(profileLink).toHaveAttribute('href', `/profiles/${user.username}`);
  });

  it('should sign-out', async () => {
    authMock.user.mockImplementation(() => user);
    const { click } = userEvent.setup();
    await renderComponent();
    await click(screen.getByRole('button', { name: /toggle profile menu/i }));
    await vi.waitFor(() => expect(screen.getByRole('menu', { name: /profile/i })).toBeVisible());
    await click(screen.getByText(/sign ?out/i));
    await vi.waitFor(() => expect(screen.queryByRole('menu', { name: /profile/i })).toBeNull());
    expect(authMock.signOut).toHaveBeenCalledTimes(1);
  });

  it('should navigate to the current user`s profile page', async () => {
    authMock.user.mockImplementation(() => user);
    const { click } = userEvent.setup();
    await renderComponent();
    await click(screen.getByRole('button', { name: /toggle profile menu/i }));
    await vi.waitFor(() => expect(screen.getByRole('menu', { name: /profile/i })).toBeVisible());
    await click(screen.getByRole('link', { name: new RegExp(user.username, 'i') }));
    await vi.waitFor(() => expect(screen.queryByRole('menu', { name: /profile/i })).toBeNull());
    expect(navigationSpy).toHaveBeenCalledTimes(1);
  });
});
