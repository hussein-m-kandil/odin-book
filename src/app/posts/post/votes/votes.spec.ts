import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../../../environments';
import { TestBed } from '@angular/core/testing';
import { post } from '../../posts.mock';
import { Posts } from '../../posts';
import { Votes } from './votes';

const postsUrl = `${environment.apiUrl}/posts`;

const postsMock = { baseUrl: postsUrl };

const setup = () => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: Posts, useValue: postsMock },
    ],
  });
  const httpTesting = TestBed.inject(HttpTestingController);
  const service = TestBed.inject(Votes);
  return { service, httpTesting };
};

describe('Votes', () => {
  it('should load nothing if not configured', () => {
    const { service, httpTesting } = setup();
    service.load();
    httpTesting.verify();
    expect(service.list()).toStrictEqual([]);
  });

  it('should load all votes if the type is not configured', () => {
    const { service, httpTesting } = setup();
    const postId = crypto.randomUUID();
    service.config({ postId });
    service.load();
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to get all votes');
    req.flush(post.votes);
    expect(req.request.url).toBe(`${postsUrl}/${postId}/votes`);
    expect(req.request.params.get('downvote')).toBeNull();
    expect(req.request.params.get('upvote')).toBeNull();
    expect(req.request.params.get('cursor')).toBeNull();
    expect(service.list()).toStrictEqual(post.votes);
    httpTesting.verify();
  });

  it('should load all votes if the type is set to `all`', () => {
    const { service, httpTesting } = setup();
    const postId = crypto.randomUUID();
    service.config({ postId, type: 'all' });
    service.load();
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to get all votes');
    req.flush(post.votes);
    expect(req.request.url).toBe(`${postsUrl}/${postId}/votes`);
    expect(req.request.params.get('downvote')).toBeNull();
    expect(req.request.params.get('upvote')).toBeNull();
    expect(req.request.params.get('cursor')).toBeNull();
    expect(service.list()).toStrictEqual(post.votes);
    httpTesting.verify();
  });

  it('should load upvotes', () => {
    const { service, httpTesting } = setup();
    const postId = crypto.randomUUID();
    service.config({ postId, type: 'upvote' });
    service.load();
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to get upvotes');
    req.flush(post.votes);
    expect(req.request.url).toBe(`${postsUrl}/${postId}/votes`);
    expect(req.request.params.get('downvote')).toBeNull();
    expect(req.request.params.get('upvote')).toBe('true');
    expect(req.request.params.get('cursor')).toBeNull();
    expect(service.list()).toStrictEqual(post.votes);
    httpTesting.verify();
  });

  it('should load downvotes', () => {
    const { service, httpTesting } = setup();
    const postId = crypto.randomUUID();
    service.config({ postId, type: 'downvote' });
    service.load();
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to get downvotes');
    req.flush(post.votes);
    expect(req.request.url).toBe(`${postsUrl}/${postId}/votes`);
    expect(req.request.params.get('downvote')).toBe('true');
    expect(req.request.params.get('upvote')).toBeNull();
    expect(req.request.params.get('cursor')).toBeNull();
    expect(service.list()).toStrictEqual(post.votes);
    httpTesting.verify();
  });

  it('should load more of all votes if the type is not configured', () => {
    const { service, httpTesting } = setup();
    const postId = crypto.randomUUID();
    service.config({ postId });
    service.list.set(post.votes);
    service.load();
    const cursor = String(post.votes.at(-1)!.order);
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to get all votes');
    const votes = post.votes.map((vote) => ({ ...vote, id: crypto.randomUUID() }));
    req.flush(votes);
    expect(req.request.url).toBe(`${postsUrl}/${postId}/votes`);
    expect(req.request.params.get('downvote')).toBeNull();
    expect(req.request.params.get('upvote')).toBeNull();
    expect(req.request.params.get('cursor')).toBe(cursor);
    expect(service.list()).toStrictEqual(post.votes.concat(votes));
    httpTesting.verify();
  });

  it('should load more of all votes if the type is set to `all`', () => {
    const { service, httpTesting } = setup();
    const postId = crypto.randomUUID();
    service.config({ postId, type: 'all' });
    service.list.set(post.votes);
    service.load();
    const cursor = String(post.votes.at(-1)!.order);
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to get all votes');
    const votes = post.votes.map((vote) => ({ ...vote, id: crypto.randomUUID() }));
    req.flush(votes);
    expect(req.request.url).toBe(`${postsUrl}/${postId}/votes`);
    expect(req.request.params.get('downvote')).toBeNull();
    expect(req.request.params.get('upvote')).toBeNull();
    expect(req.request.params.get('cursor')).toBe(cursor);
    expect(service.list()).toStrictEqual(post.votes.concat(votes));
    httpTesting.verify();
  });

  it('should load more upvotes', () => {
    const { service, httpTesting } = setup();
    const postId = crypto.randomUUID();
    service.config({ postId, type: 'upvote' });
    service.list.set(post.votes);
    service.load();
    const cursor = String(post.votes.at(-1)!.order);
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to get upvotes');
    const votes = post.votes.map((vote) => ({ ...vote, id: crypto.randomUUID() }));
    req.flush(votes);
    expect(req.request.url).toBe(`${postsUrl}/${postId}/votes`);
    expect(req.request.params.get('downvote')).toBeNull();
    expect(req.request.params.get('upvote')).toBe('true');
    expect(req.request.params.get('cursor')).toBe(cursor);
    expect(service.list()).toStrictEqual(post.votes.concat(votes));
    httpTesting.verify();
  });

  it('should load more downvotes', () => {
    const { service, httpTesting } = setup();
    const postId = crypto.randomUUID();
    service.config({ postId, type: 'downvote' });
    service.list.set(post.votes);
    service.load();
    const cursor = String(post.votes.at(-1)!.order);
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to get downvotes');
    const votes = post.votes.map((vote) => ({ ...vote, id: crypto.randomUUID() }));
    req.flush(votes);
    expect(req.request.url).toBe(`${postsUrl}/${postId}/votes`);
    expect(req.request.params.get('downvote')).toBe('true');
    expect(req.request.params.get('upvote')).toBeNull();
    expect(req.request.params.get('cursor')).toBe(cursor);
    expect(service.list()).toStrictEqual(post.votes.concat(votes));
    httpTesting.verify();
  });
});
