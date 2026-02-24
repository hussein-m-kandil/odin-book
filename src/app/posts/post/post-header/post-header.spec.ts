import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { PostHeader } from './post-header';
import { post } from '../../posts.mock';

const renderComponent = ({ inputs, ...options }: RenderComponentOptions<PostHeader> = {}) => {
  return render(PostHeader, {
    inputs: { author: post.author, date: post.createdAt, ...inputs },
    ...options,
  });
};

describe('PostHeader', () => {
  it('should display the author name as a link', async () => {
    await renderComponent();
    const authorLink = screen.getByRole('link', { name: new RegExp(post.author.username) });
    expect(authorLink).toHaveAttribute('href', `/profiles/${post.author.username}`);
    expect(authorLink).toBeVisible();
  });

  it('should display the author avatar', async () => {
    await renderComponent();
    const authorAvatar = screen.getByRole('img', {
      name: post.author.username,
    }) as HTMLImageElement;
    expect(authorAvatar).toBeVisible();
    expect(authorAvatar.src).toMatch(new RegExp(post.author.avatar!.image.src));
  });

  it('should display the post date', async () => {
    await renderComponent();
    const authorLink = screen.getByRole('time');
    expect(authorLink).toHaveAttribute('datetime', post.createdAt);
    expect(authorLink).toBeVisible();
  });

  it('should not have a privacy indicator', async () => {
    await renderComponent();
    expect(screen.queryByLabelText(/private/i)).toBeNull();
    expect(screen.queryByLabelText(/public/i)).toBeNull();
  });

  it('should have a private indicator', async () => {
    await renderComponent({ inputs: { public: false } });
    expect(screen.getByLabelText(/private/i)).toBeVisible();
    expect(screen.queryByLabelText(/public/i)).toBeNull();
  });

  it('should have a public indicator', async () => {
    await renderComponent({ inputs: { public: true } });
    expect(screen.queryByLabelText(/private/i)).toBeNull();
    expect(screen.getByLabelText(/public/i)).toBeVisible();
  });

  it('should not have a delete button', async () => {
    await renderComponent();
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
  });

  it('should have a delete button', async () => {
    await renderComponent({ inputs: { deleteLabel: 'Delete' } });
    const delBtn = screen.getByRole('button', { name: /delete/i });
    expect(delBtn).toBeVisible();
    expect(delBtn).not.toHaveClass('p-button-loading');
  });

  it('should have a delete button in the loading stating', async () => {
    await renderComponent({ inputs: { deleteLabel: 'Delete', deleting: true } });
    const delBtn = screen.getByRole('button', { name: /delete/i });
    expect(delBtn).toBeVisible();
    expect(delBtn).toHaveClass('p-button-loading');
  });

  it('should emit `deleted` event', async () => {
    const deleted = vi.fn();
    const actor = userEvent.setup();
    await renderComponent({ inputs: { deleteLabel: 'Delete' }, on: { deleted } });
    await actor.click(screen.getByRole('button', { name: /delete/i }));
    expect(deleted).toHaveBeenCalledExactlyOnceWith(undefined);
  });
});
