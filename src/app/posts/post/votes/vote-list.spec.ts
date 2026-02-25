import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { MessageService } from 'primeng/api';
import { Votes, VoteType } from './votes';
import { post } from '../../posts.mock';
import { VoteList } from './vote-list';

const votesMock = {
  config: vi.fn(),
  load: vi.fn(),
  reset: vi.fn(),
  loadError: vi.fn(() => ''),
  loading: vi.fn(() => false),
  hasMore: vi.fn(() => false),
  isCurrentProfile: vi.fn(() => false),
  list: vi.fn<() => unknown[]>(() => []),
  profileUpdated: { subscribe: vi.fn() },
  searchValue: { set: vi.fn() },
  path: { set: vi.fn() },
};

const renderComponent = ({ providers, ...options }: RenderComponentOptions<VoteList> = {}) => {
  return render(VoteList, {
    providers: [{ provide: MessageService, useValue: { add: vi.fn() } }, ...(providers || [])],
    componentProviders: [{ provide: Votes, useValue: votesMock }],
    autoDetectChanges: false,
    ...options,
  });
};

describe('VoteList', () => {
  afterEach(vi.resetAllMocks);

  const voteTypes: VoteType[] = ['all', 'upvote', 'downvote'];
  for (const type of voteTypes) {
    it('should load votes that configured with the given type and post id', async () => {
      const inputs = { type, postId: post.id };
      await renderComponent({ inputs });
      expect(votesMock.load).toHaveBeenCalledOnce();
      expect(votesMock.config).toHaveBeenCalledExactlyOnceWith(inputs);
    });
  }

  it('should render no-votes message', async () => {
    votesMock.list.mockImplementation(() => []);
    await renderComponent({ inputs: { postId: post.id } });
    expect(screen.getByText(/there are no votes/i)).toBeVisible();
    expect(screen.queryByRole('listitem')).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('should render the votes', async () => {
    votesMock.list.mockImplementation(() => post.votes);
    await renderComponent({ inputs: { postId: post.id } });
    const lists = screen.getAllByRole('list');
    const listitems = screen.getAllByRole('listitem');
    expect(lists).toHaveLength(1);
    expect(listitems).toHaveLength(post.votes.length);
    for (const list of lists) expect(list).toBeVisible();
    for (const listitem of listitems) expect(listitem).toBeVisible();
    for (const { user } of post.votes) {
      const profileLink = screen.getByRole('link', { name: user.username }) as HTMLAnchorElement;
      const name = new RegExp(user.username, 'i');
      expect(screen.getByText(name)).toBeVisible();
      expect(screen.getByRole('img', { name })).toBeVisible();
      expect(profileLink.href).toMatch(new RegExp(`/profiles/${user.username}$`));
      expect(profileLink).toBeVisible();
    }
  });
});
