import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { HttpParams } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { PostList } from './post-list';
import { posts } from '../posts.mock';
import { Posts } from '../posts';

const postsMock = {
  load: vi.fn(),
  reset: vi.fn(),
  setParams: vi.fn(),
  list: vi.fn(() => posts),
  loadError: vi.fn(() => ''),
  loading: vi.fn(() => false),
  hasMore: vi.fn(() => false),
  isAuthoredByCurrentUser: vi.fn(() => false),
};

const renderComponent = ({
  providers,
  inputs,
  ...options
}: RenderComponentOptions<PostList> = {}) => {
  return render(PostList, {
    providers: [
      { provide: MessageService, useValue: { add: vi.fn() } },
      { provide: Posts, useValue: postsMock },
      ...(providers || []),
    ],
    inputs: { following: false, ...inputs },
    autoDetectChanges: false,
    ...options,
  });
};

describe('PostList', () => {
  afterEach(vi.resetAllMocks);

  it('should reset and load posts on initial render', async () => {
    await renderComponent();
    expect(postsMock.load).toHaveBeenCalledTimes(1);
    expect(postsMock.reset).toHaveBeenCalledTimes(1);
    expect(postsMock.setParams).toHaveBeenCalledTimes(0);
  });

  it('should reset and load posts on input changes', async () => {
    const { rerender } = await renderComponent();
    await rerender({ partialUpdate: true });
    await rerender({ partialUpdate: true });
    expect(postsMock.load).toHaveBeenCalledTimes(3);
    expect(postsMock.reset).toHaveBeenCalledTimes(3);
    expect(postsMock.setParams).toHaveBeenCalledTimes(0);
  });

  it('should set the "following" parameter on posts', async () => {
    const { rerender } = await renderComponent({ inputs: { following: true } });
    expect(postsMock.load).toHaveBeenCalledTimes(1);
    expect(postsMock.reset).toHaveBeenCalledTimes(1);
    expect(postsMock.setParams).toHaveBeenCalledTimes(1);
    expect(postsMock.setParams.mock.calls[0][0]).toBeInstanceOf(HttpParams);
    expect((postsMock.setParams.mock.calls[0][0] as HttpParams).get('following')).toBe('true');
    vi.resetAllMocks();
    await rerender({ partialUpdate: true, inputs: { following: 'false' } });
    expect(postsMock.load).toHaveBeenCalledTimes(1);
    expect(postsMock.reset).toHaveBeenCalledTimes(1);
    expect(postsMock.setParams).toHaveBeenCalledTimes(0);
    vi.resetAllMocks();
    await rerender({ partialUpdate: true, inputs: { following: 'blah' } });
    expect(postsMock.load).toHaveBeenCalledTimes(1);
    expect(postsMock.reset).toHaveBeenCalledTimes(1);
    expect(postsMock.setParams).toHaveBeenCalledTimes(1);
    expect(postsMock.setParams.mock.calls[0][0]).toBeInstanceOf(HttpParams);
    expect((postsMock.setParams.mock.calls[0][0] as HttpParams).get('following')).toBe('true');
    vi.resetAllMocks();
    await rerender({ partialUpdate: true, inputs: { following: false } });
    expect(postsMock.load).toHaveBeenCalledTimes(1);
    expect(postsMock.reset).toHaveBeenCalledTimes(1);
    expect(postsMock.setParams).toHaveBeenCalledTimes(0);
    vi.resetAllMocks();
    await rerender({ partialUpdate: true, inputs: { following: '' } });
    expect(postsMock.load).toHaveBeenCalledTimes(1);
    expect(postsMock.reset).toHaveBeenCalledTimes(1);
    expect(postsMock.setParams).toHaveBeenCalledTimes(1);
    expect(postsMock.setParams.mock.calls[0][0]).toBeInstanceOf(HttpParams);
    expect((postsMock.setParams.mock.calls[0][0] as HttpParams).get('following')).toBe('true');
    vi.resetAllMocks();
  });

  it('should render no-posts message', async () => {
    postsMock.list.mockImplementation(() => []);
    await renderComponent();
    expect(screen.getByText(/there are no posts/i)).toBeVisible();
    expect(screen.queryByRole('listitem')).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('should render the posts', async () => {
    postsMock.list.mockImplementation(() => posts);
    await renderComponent();
    const lists = screen.getAllByRole('list');
    const listitems = screen.getAllByRole('listitem');
    expect(lists).toHaveLength(1);
    expect(listitems).toHaveLength(posts.length);
    for (const list of lists) expect(list).toBeVisible();
    for (const listitem of listitems) expect(listitem).toBeVisible();
  });
});
