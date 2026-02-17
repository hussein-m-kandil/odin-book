import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { post } from '../posts.mock';
import { Post } from './post';

const renderComponent = ({ inputs, ...options }: RenderComponentOptions<Post> = {}) => {
  return render(Post, { inputs: { post, ...inputs }, autoDetectChanges: false, ...options });
};

describe('Post', () => {
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

  it('should display the post content as plain text', async () => {
    await renderComponent();
    expect(screen.queryByRole('link', { name: post.content })).toBeNull();
    expect(screen.getByText(post.content)).toBeVisible();
  });

  it('should display the post content as a link to the post page', async () => {
    await renderComponent({ inputs: { brief: true } });
    const postLink = screen.getByRole('link', { name: post.content }) as HTMLAnchorElement;
    expect(postLink).toBeVisible();
    expect(postLink.href).toMatch(new RegExp(`${post.id}$`));
  });

  it('should have the post image', async () => {
    await renderComponent();
    expect(screen.getByRole('presentation', { name: '' })).toBeVisible();
  });

  it('should not have a post image', async () => {
    await renderComponent({ inputs: { post: { ...post, image: null, imageId: null } } });
    expect(screen.queryByRole('presentation', { name: '' })).toBeNull();
  });

  it('should display counts for likes, dislikes, and comments', async () => {
    await renderComponent();
    expect(screen.getByText(new RegExp(`^${post._count.upvotes} likes?$`))).toBeVisible();
    expect(screen.getByText(new RegExp(`^${post._count.comments} comments?$`))).toBeVisible();
    expect(screen.getByText(new RegExp(`^${post._count.downvotes} dislikes?$`))).toBeVisible();
  });

  it('should have like and dislike buttons', async () => {
    await renderComponent({
      inputs: { post: { ...post, upvotedByCurrentUser: false, downvotedByCurrentUser: false } },
    });
    expect(screen.getByRole('button', { name: 'Like' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Dislike' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Disliked' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Liked' })).toBeNull();
  });

  it('should have liked and dislike buttons', async () => {
    await renderComponent({
      inputs: { post: { ...post, upvotedByCurrentUser: true, downvotedByCurrentUser: false } },
    });
    expect(screen.getByRole('button', { name: 'Liked' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Dislike' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Disliked' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Like' })).toBeNull();
  });

  it('should have like and disliked buttons', async () => {
    await renderComponent({
      inputs: { post: { ...post, upvotedByCurrentUser: false, downvotedByCurrentUser: true } },
    });
    expect(screen.getByRole('button', { name: 'Like' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Disliked' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Dislike' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Liked' })).toBeNull();
  });

  it('should not have liked and disliked buttons', async () => {
    await renderComponent({
      inputs: { post: { ...post, upvotedByCurrentUser: true, downvotedByCurrentUser: true } },
    });
    expect(screen.getByRole('button', { name: 'Like' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Dislike' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Disliked' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Liked' })).toBeNull();
  });
});
