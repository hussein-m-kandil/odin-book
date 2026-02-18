import { render, RenderComponentOptions, screen } from '@testing-library/angular';
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
});
