import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { CommentList } from './comment-list';
import { post } from '../../posts.mock';

const renderComponent = ({ inputs, ...options }: RenderComponentOptions<CommentList> = {}) => {
  return render(CommentList, { inputs: { comments: post.comments, ...inputs }, ...options });
};

describe('CommentList', () => {
  it('should display a list of comments', async () => {
    await renderComponent();
    expect(screen.getByRole('list')).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(post.comments.length);
    expect(screen.getAllByRole('article')).toHaveLength(post.comments.length);
    for (const comment of post.comments) {
      expect(screen.getByText(comment.author.username)).toBeVisible();
      expect(screen.getByText(comment.content)).toBeVisible();
    }
    for (const time of screen.getAllByRole('time')) {
      expect(
        post.comments.some(({ createdAt }) => time.getAttribute('datetime') === createdAt),
      ).toBe(true);
    }
  });
});
