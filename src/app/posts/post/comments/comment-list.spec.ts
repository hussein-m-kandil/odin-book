import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { environment } from '../../../../environments';
import { CommentList } from './comment-list';
import { Comment } from '../../posts.types';
import { post } from '../../posts.mock';
import { Comments } from '../comments';
import { Posts } from '../../posts';

const postsUrl = `${environment.apiUrl}/posts`;

const { comments } = post;

const postsMock = { baseUrl: postsUrl };

const commentsMock = {
  config: vi.fn(),
  load: vi.fn(),
  reset: vi.fn(),
  loadError: vi.fn(() => ''),
  loading: vi.fn(() => false),
  hasMore: vi.fn(() => false),
  list: vi.fn(() => comments),
  isCurrentProfile: vi.fn(() => false),
  profileUpdated: { subscribe: vi.fn() },
  searchValue: { set: vi.fn() },
  path: { set: vi.fn() },
};

const renderComponent = ({ providers, ...options }: RenderComponentOptions<CommentList> = {}) => {
  return render(CommentList, {
    providers: [
      { provide: Comments, useValue: commentsMock },
      { provide: Posts, useValue: postsMock },
      ...(providers || []),
    ],
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

  it('should render no-comments message', async () => {
    commentsMock.list.mockImplementation(() => []);
    await renderComponent();
    expect(screen.getByText(/there are no comments/i)).toBeVisible();
    expect(screen.queryByRole('listitem')).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('should display a list of comments', async () => {
    commentsMock.list.mockImplementation(() => comments);
    await renderComponent();
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
});
