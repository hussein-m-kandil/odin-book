import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { booleanAttribute, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { userEvent } from '@testing-library/user-event';
import { Tab, Tabs, TabList } from 'primeng/tabs';
import { Home } from './home';

@Component({
  selector: 'app-post-list',
  template: `
    @if (following()) {
      <p>Posts of Following</p>
    } @else {
      <p>Posts of Everybody</p>
    }
  `,
})
class PostList {
  readonly following = input(false, { transform: booleanAttribute });
}

const renderComponent = (options: RenderComponentOptions<Home> = {}) => {
  return render(Home, {
    componentImports: [RouterLinkActive, RouterLink, PostList, TabList, Tabs, Tab],
    autoDetectChanges: false,
    ...options,
  });
};

describe('Home', () => {
  it('should have nav links as tabs', async () => {
    await renderComponent();
    const everybodyLink = screen.getByRole('link', { name: /everybody/i });
    const followingLink = screen.getByRole('link', { name: /following/i });
    const everybodyTab = screen.getByRole('tab', { name: /everybody/i });
    const followingTab = screen.getByRole('tab', { name: /following/i });
    expect(screen.getByRole('navigation')).toBeVisible();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.getByRole('tablist')).toBeVisible();
    expect(everybodyLink).toBeVisible();
    expect(followingLink).toBeVisible();
    expect(everybodyTab).toBeVisible();
    expect(followingTab).toBeVisible();
    expect(everybodyLink).toHaveAttribute('href', '/');
    expect(followingLink).toHaveAttribute('href', '/?following=posts');
  });

  it('should display posts of everybody', async () => {
    await renderComponent();
    const everybodyTab = screen.getByRole('tab', { name: /everybody/i });
    const followingTab = screen.getByRole('tab', { name: /following/i });
    expect(everybodyTab).toBeVisible();
    expect(followingTab).toBeVisible();
    expect(everybodyTab).toHaveClass('p-tab-active');
    expect(followingTab).not.toHaveClass('p-tab-active');
    expect(everybodyTab).toHaveAttribute('aria-selected', 'true');
    expect(followingTab).not.toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Posts of Everybody')).toBeVisible();
    expect(screen.queryByText('Posts of Following')).toBeNull();
  });

  it('should display posts of following', async () => {
    const actor = userEvent.setup();
    await renderComponent();
    await actor.click(screen.getByRole('link', { name: /following/i }));
    const everybodyTab = screen.getByRole('tab', { name: /everybody/i });
    const followingTab = screen.getByRole('tab', { name: /following/i });
    expect(everybodyTab).toBeVisible();
    expect(followingTab).toBeVisible();
    expect(followingTab).toHaveClass('p-tab-active');
    expect(everybodyTab).not.toHaveClass('p-tab-active');
    expect(followingTab).toHaveAttribute('aria-selected', 'true');
    expect(everybodyTab).not.toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Posts of Following')).toBeVisible();
    expect(screen.queryByText('Posts of Everybody')).toBeNull();
  });

  it('should return to everybody posts', async () => {
    const actor = userEvent.setup();
    await renderComponent();
    await actor.click(screen.getByRole('link', { name: /following/i }));
    await actor.click(screen.getByRole('link', { name: /everybody/i }));
    const everybodyTab = screen.getByRole('tab', { name: /everybody/i });
    const followingTab = screen.getByRole('tab', { name: /following/i });
    expect(everybodyTab).toBeVisible();
    expect(followingTab).toBeVisible();
    expect(everybodyTab).toHaveClass('p-tab-active');
    expect(followingTab).not.toHaveClass('p-tab-active');
    expect(everybodyTab).toHaveAttribute('aria-selected', 'true');
    expect(followingTab).not.toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Posts of Everybody')).toBeVisible();
    expect(screen.queryByText('Posts of Following')).toBeNull();
  });
});
