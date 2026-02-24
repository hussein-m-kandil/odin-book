import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { HttpErrorResponse } from '@angular/common/http';
import { userEvent } from '@testing-library/user-event';
import { environment } from '../../../../environments';
import { Observable, of, Subscriber } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CommentList } from './comment-list';
import { Comment } from '../../posts.types';
import { post } from '../../posts.mock';
import { Comments } from '../comments';
import { Auth } from '../../../auth';
import { Posts } from '../../posts';

const postsUrl = `${environment.apiUrl}/posts`;

const { comments } = post;

const postsMock = { baseUrl: postsUrl };

const toastMock = { add: vi.fn() };

const authMock = { user: vi.fn(), userUpdated: { subscribe: vi.fn() } };

const commentsMock = {
  config: vi.fn(),
  load: vi.fn(),
  reset: vi.fn(),
  loadError: vi.fn(() => ''),
  loading: vi.fn(() => false),
  hasMore: vi.fn(() => false),
  list: vi.fn(() => comments),
  createComment: vi.fn(() => of()),
  deleteComment: vi.fn(() => of()),
};

const renderComponent = ({
  providers,
  inputs,
  ...options
}: RenderComponentOptions<CommentList> = {}) => {
  return render(CommentList, {
    providers: [
      { provide: MessageService, useValue: toastMock },
      { provide: Comments, useValue: commentsMock },
      { provide: Posts, useValue: postsMock },
      { provide: Auth, useValue: authMock },
      ...(providers || []),
    ],
    inputs: { postId: post.id, ...inputs },
    autoDetectChanges: false,
    ...options,
  });
};

describe('CommentList', () => {
  afterEach(vi.resetAllMocks);

  it('should load comments that configured with the given type and post id', async () => {
    const inputs = { postId: post.id };
    await renderComponent({ inputs });
    expect(commentsMock.load).toHaveBeenCalledOnce();
    expect(commentsMock.config).toHaveBeenCalledExactlyOnceWith(inputs);
  });

  it('should render no-comments message, and have a comment form', async () => {
    commentsMock.list.mockImplementation(() => []);
    await renderComponent();
    expect(screen.getByRole('form', { name: /comment/i })).toBeVisible();
    expect(screen.getByText(/there are no comments/i)).toBeVisible();
    expect(screen.queryByRole('listitem')).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('should display a list of comments, and have a comment form', async () => {
    commentsMock.list.mockImplementation(() => comments);
    await renderComponent();
    expect(screen.getByRole('form', { name: /comment/i })).toBeVisible();
    expect(screen.getByRole('list')).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(comments.length);
    expect(screen.getAllByRole('article')).toHaveLength(comments.length);
    for (const comment of comments) {
      expect(screen.getByText(comment.author.username)).toBeVisible();
      expect(screen.getByText(comment.content)).toBeVisible();
    }
    const isCommentTime = (comment: Comment, time: HTMLElement) => {
      return time.getAttribute('datetime') === comment.createdAt;
    };
    for (const time of screen.getAllByRole('time')) {
      expect(comments.some((comment) => isCommentTime(comment, time))).toBe(true);
    }
  });

  it('should not have a delete button if the current user is not the comment author, nor mutable', async () => {
    authMock.user.mockImplementation(() => ({
      ...post.author,
      isAdmin: false,
      id: crypto.randomUUID(),
    }));
    await renderComponent({ inputs: { mutable: false } });
    expect(screen.queryAllByRole('button', { name: /delete comment/i })).toHaveLength(0);
  });

  it('should have a delete button if the current user is not the comment author, but it is mutable', async () => {
    authMock.user.mockImplementation(() => ({
      ...post.author,
      isAdmin: false,
      id: crypto.randomUUID(),
    }));
    await renderComponent({ inputs: { mutable: true } });
    expect(screen.getAllByRole('button', { name: /delete comment/i })).toHaveLength(
      post.comments.length,
    );
  });

  it('should have a delete button if the current user is not an admin, but it is the comment author', async () => {
    authMock.user.mockImplementation(() => ({
      ...post.author,
      isAdmin: false,
    }));
    await renderComponent();
    expect(screen.getAllByRole('button', { name: /delete comment/i })).toHaveLength(
      post.comments.length,
    );
  });

  it('should display a confirmation form when click delete', async () => {
    authMock.user.mockImplementation(() => post.author);
    const actor = userEvent.setup();
    await renderComponent();
    const delBtn = screen.getByRole('button', { name: /delete comment/i });
    await actor.click(delBtn);
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(delBtn).toHaveClass('p-button-loading');
    expect(commentsMock.deleteComment).toHaveBeenCalledTimes(0);
    expect(screen.getByRole('form', { name: /delete confirmation/i })).toBeVisible();
    expect(screen.getByText('Are you really want to delete this comment?')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeVisible();
  });

  it('should cancel the deletion', async () => {
    authMock.user.mockImplementation(() => post.author);
    const actor = userEvent.setup();
    await renderComponent();
    await actor.click(screen.getByRole('button', { name: /delete comment/i }));
    await actor.click(screen.getByRole('button', { name: /close delete confirmation/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(commentsMock.deleteComment).toHaveBeenCalledTimes(0);
    expect(screen.getByRole('button', { name: /delete comment/i })).not.toHaveClass(
      'p-button-loading',
    );
    expect(screen.queryByRole('button', { name: /close delete confirmation/i })).toBeNull();
    expect(screen.queryByText('Are you really want to delete this comment?')).toBeNull();
    expect(screen.queryByRole('form', { name: /delete confirmation/i })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should delete the comment, and navigate to the home page', async () => {
    let sub!: Subscriber<void>;
    commentsMock.deleteComment.mockImplementation(() => new Observable((s) => (sub = s)));
    authMock.user.mockImplementation(() => post.author);
    const actor = userEvent.setup();
    const { detectChanges } = await renderComponent();
    const delBtn = screen.getByRole('button', { name: /delete comment/i });
    await actor.click(delBtn);
    await actor.click(screen.getByRole('button', { name: 'Delete' }));
    expect(delBtn).toHaveClass('p-button-loading');
    expect(commentsMock.deleteComment).toHaveBeenCalledTimes(1);
    sub.next();
    sub.complete();
    detectChanges();
    expect(delBtn).not.toHaveClass('p-button-loading');
    expect(commentsMock.deleteComment).toHaveBeenCalledTimes(1);
  });

  it('should delete the comment, but not navigate to the home page', async () => {
    let sub!: Subscriber<void>;
    commentsMock.deleteComment.mockImplementation(() => new Observable((s) => (sub = s)));
    authMock.user.mockImplementation(() => post.author);
    const actor = userEvent.setup();
    const { detectChanges } = await renderComponent();
    const delBtn = screen.getByRole('button', { name: /delete comment/i });
    await actor.click(delBtn);
    await actor.click(screen.getByRole('button', { name: 'Delete' }));
    expect(delBtn).toHaveClass('p-button-loading');
    expect(commentsMock.deleteComment).toHaveBeenCalledTimes(1);
    sub.next();
    sub.complete();
    detectChanges();
    expect(delBtn).not.toHaveClass('p-button-loading');
    expect(commentsMock.deleteComment).toHaveBeenCalledTimes(1);
  });

  it('should fail to delete the comment', async () => {
    let sub!: Subscriber<void>;
    commentsMock.deleteComment.mockImplementation(() => new Observable((s) => (sub = s)));
    authMock.user.mockImplementation(() => post.author);
    const actor = userEvent.setup();
    const error = { message: 'Test error.' };
    const { detectChanges } = await renderComponent();
    const delBtn = screen.getByRole('button', { name: /delete comment/i });
    await actor.click(delBtn);
    await actor.click(screen.getByRole('button', { name: 'Delete' }));
    expect(delBtn).toHaveClass('p-button-loading');
    expect(commentsMock.deleteComment).toHaveBeenCalledTimes(1);
    sub.error(new HttpErrorResponse({ status: 400, error }));
    detectChanges();
    expect(delBtn).toHaveClass('p-button-loading');
    expect(commentsMock.deleteComment).toHaveBeenCalledTimes(1);
    expect(toastMock.add).toHaveBeenCalledExactlyOnceWith({
      summary: 'Deletion failed',
      detail: error.message,
      severity: 'error',
    });
  });
});
