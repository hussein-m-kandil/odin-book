import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { Observable, of, Subscriber } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { post } from '../posts.mock';
import { Posts } from '../posts';
import { Post } from './post';

const navigationSpy = vi.spyOn(Router.prototype, 'navigate');

const toastMock = { add: vi.fn() };

const postsMock = {
  upvote: vi.fn(() => of()),
  unvote: vi.fn(() => of()),
  downvote: vi.fn(() => of()),
};

const renderComponent = ({ providers, inputs, ...options }: RenderComponentOptions<Post> = {}) => {
  return render(Post, {
    providers: [
      { provide: MessageService, useValue: toastMock },
      { provide: Posts, useValue: postsMock },
      ...(providers || []),
    ],
    inputs: { post, ...inputs },
    autoDetectChanges: false,
    ...options,
  });
};

describe('Post', () => {
  afterEach(vi.resetAllMocks);

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
    expect(
      screen.getByRole('button', { name: new RegExp(`^${post._count.upvotes} likes?$`) }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: new RegExp(`^${post._count.comments} comments?$`) }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: new RegExp(`^${post._count.downvotes} dislikes?$`) }),
    ).toBeVisible();
  });

  for (const label of ['Likes', 'Dislikes']) {
    const lowerLabel = label.toLowerCase();
    it(`should display a list of ${lowerLabel} after clicking its button`, async () => {
      const actor = userEvent.setup();
      await renderComponent();
      await actor.click(screen.getByRole('button', { name: new RegExp(`\\d+ ${lowerLabel}?`) }));
      expect(screen.getByRole('dialog', { name: label })).toBeVisible();
      expect(navigationSpy).toHaveBeenCalledTimes(1);
      expect(navigationSpy.mock.calls[0][0]).toStrictEqual(['.']);
      expect(navigationSpy.mock.calls[0][1]).toHaveProperty('relativeTo');
      expect(navigationSpy.mock.calls[0][1]).not.toHaveProperty('replaceUrl');
      expect(navigationSpy.mock.calls[0][1]).toHaveProperty('queryParams', { modal: label });
      navigationSpy.mockClear();
      await actor.click(screen.getByRole('button', { name: /close/i }));
      expect(screen.queryByRole('dialog', { name: label })).toBeNull();
      expect(navigationSpy).toHaveBeenCalledTimes(1);
      expect(navigationSpy.mock.calls[0][0]).toStrictEqual(['.']);
      expect(navigationSpy.mock.calls[0][1]).toHaveProperty('relativeTo');
      expect(navigationSpy.mock.calls[0][1]).not.toHaveProperty('queryParams');
      expect(navigationSpy.mock.calls[0][1]).toHaveProperty('replaceUrl', true);
    });
  }

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

  it('should like the post', async () => {
    let sub!: Subscriber<void>;
    postsMock.upvote.mockImplementation(() => new Observable((s) => (sub = s)));
    const actor = userEvent.setup();
    const { detectChanges } = await renderComponent({
      inputs: { post: { ...post, upvotedByCurrentUser: false, downvotedByCurrentUser: false } },
    });
    const likeBtn = screen.getByRole('button', { name: 'Like' });
    await actor.click(likeBtn);
    expect(likeBtn).toBeVisible();
    expect(likeBtn).toHaveClass('p-disabled', 'p-button-loading');
    sub.next();
    sub.complete();
    detectChanges();
    expect(likeBtn).toBeVisible();
    expect(likeBtn).not.toHaveClass('p-disabled', 'p-button-loading');
    expect(postsMock.upvote).toHaveBeenCalledExactlyOnceWith(post.id);
  });

  it('should like a disliked post', async () => {
    let sub!: Subscriber<void>;
    postsMock.upvote.mockImplementation(() => new Observable((s) => (sub = s)));
    const actor = userEvent.setup();
    const { detectChanges } = await renderComponent({
      inputs: { post: { ...post, upvotedByCurrentUser: false, downvotedByCurrentUser: true } },
    });
    const likeBtn = screen.getByRole('button', { name: 'Like' });
    await actor.click(likeBtn);
    expect(likeBtn).toBeVisible();
    expect(likeBtn).toHaveClass('p-disabled', 'p-button-loading');
    sub.next();
    sub.complete();
    detectChanges();
    expect(likeBtn).toBeVisible();
    expect(likeBtn).not.toHaveClass('p-disabled', 'p-button-loading');
    expect(postsMock.upvote).toHaveBeenCalledExactlyOnceWith(post.id);
  });

  it('should dislike the post', async () => {
    let sub!: Subscriber<void>;
    postsMock.downvote.mockImplementation(() => new Observable((s) => (sub = s)));
    const actor = userEvent.setup();
    const { detectChanges } = await renderComponent({
      inputs: { post: { ...post, upvotedByCurrentUser: false, downvotedByCurrentUser: false } },
    });
    const dislikeBtn = screen.getByRole('button', { name: 'Dislike' });
    await actor.click(dislikeBtn);
    expect(dislikeBtn).toBeVisible();
    expect(dislikeBtn).toHaveClass('p-disabled', 'p-button-loading');
    sub.next();
    sub.complete();
    detectChanges();
    expect(dislikeBtn).toBeVisible();
    expect(dislikeBtn).not.toHaveClass('p-disabled', 'p-button-loading');
    expect(postsMock.downvote).toHaveBeenCalledExactlyOnceWith(post.id);
  });

  it('should dislike a liked post', async () => {
    let sub!: Subscriber<void>;
    postsMock.downvote.mockImplementation(() => new Observable((s) => (sub = s)));
    const actor = userEvent.setup();
    const { detectChanges } = await renderComponent({
      inputs: { post: { ...post, upvotedByCurrentUser: true, downvotedByCurrentUser: false } },
    });
    const dislikeBtn = screen.getByRole('button', { name: 'Dislike' });
    await actor.click(dislikeBtn);
    expect(dislikeBtn).toBeVisible();
    expect(dislikeBtn).toHaveClass('p-disabled', 'p-button-loading');
    sub.next();
    sub.complete();
    detectChanges();
    expect(dislikeBtn).toBeVisible();
    expect(dislikeBtn).not.toHaveClass('p-disabled', 'p-button-loading');
    expect(postsMock.downvote).toHaveBeenCalledExactlyOnceWith(post.id);
  });

  it('should remove a like from the post', async () => {
    let sub!: Subscriber<void>;
    postsMock.unvote.mockImplementation(() => new Observable((s) => (sub = s)));
    const actor = userEvent.setup();
    const { detectChanges } = await renderComponent({
      inputs: { post: { ...post, upvotedByCurrentUser: true, downvotedByCurrentUser: false } },
    });
    const likeBtn = screen.getByRole('button', { name: 'Liked' });
    await actor.click(likeBtn);
    expect(likeBtn).toBeVisible();
    expect(likeBtn).toHaveClass('p-disabled', 'p-button-loading');
    sub.next();
    sub.complete();
    detectChanges();
    expect(likeBtn).toBeVisible();
    expect(likeBtn).not.toHaveClass('p-disabled', 'p-button-loading');
    expect(postsMock.unvote).toHaveBeenCalledExactlyOnceWith(post.id);
  });

  it('should remove a dislike from the post', async () => {
    let sub!: Subscriber<void>;
    postsMock.unvote.mockImplementation(() => new Observable((s) => (sub = s)));
    const actor = userEvent.setup();
    const { detectChanges } = await renderComponent({
      inputs: { post: { ...post, upvotedByCurrentUser: false, downvotedByCurrentUser: true } },
    });
    const likeBtn = screen.getByRole('button', { name: 'Disliked' });
    await actor.click(likeBtn);
    expect(likeBtn).toBeVisible();
    expect(likeBtn).toHaveClass('p-disabled', 'p-button-loading');
    sub.next();
    sub.complete();
    detectChanges();
    expect(likeBtn).toBeVisible();
    expect(likeBtn).not.toHaveClass('p-disabled', 'p-button-loading');
    expect(postsMock.unvote).toHaveBeenCalledExactlyOnceWith(post.id);
  });

  it('should have a list of comments', async () => {
    await renderComponent({ inputs: { brief: false } });
    for (const comment of post.comments) expect(screen.getByText(comment.content)).toBeVisible();
  });

  it('should not have a list of comments', async () => {
    await renderComponent({ inputs: { brief: true } });
    for (const comment of post.comments) expect(screen.queryByText(comment.content)).toBeNull();
  });

  it('should have a button that toggles the post comments', async () => {
    const actor = userEvent.setup();
    await renderComponent({ inputs: { brief: true } });
    for (const comment of post.comments) expect(screen.queryByText(comment.content)).toBeNull();
    await actor.click(screen.getByRole('button', { name: /comments?/i }));
    for (const comment of post.comments) expect(screen.getByText(comment.content)).toBeVisible();
    await actor.click(screen.getByRole('button', { name: /comments?/i }));
    for (const comment of post.comments) expect(screen.queryByText(comment.content)).toBeNull();
  });
});
