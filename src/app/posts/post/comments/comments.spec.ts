import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../../../../environments';
import { TestBed } from '@angular/core/testing';
import { post } from '../../posts.mock';
import { Comments } from './comments';
import { Posts } from '../../posts';

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
  const service = TestBed.inject(Comments);
  return { service, httpTesting };
};

describe('Comments', () => {
  it('should load nothing if not configured', () => {
    const { service, httpTesting } = setup();
    service.load();
    httpTesting.verify();
    expect(service.list()).toStrictEqual([]);
  });

  it('should load comments if the type is not configured', () => {
    const { service, httpTesting } = setup();
    const postId = crypto.randomUUID();
    service.config({ postId });
    service.load();
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to get all comments');
    req.flush(post.comments);
    expect(req.request.url).toBe(`${postsUrl}/${postId}/comments`);
    expect(req.request.params.get('downvote')).toBeNull();
    expect(req.request.params.get('upvote')).toBeNull();
    expect(req.request.params.get('cursor')).toBeNull();
    expect(service.list()).toStrictEqual(post.comments);
    httpTesting.verify();
  });

  it('should load more of all comments if the type is not configured', () => {
    const { service, httpTesting } = setup();
    const postId = crypto.randomUUID();
    service.config({ postId });
    service.list.set(post.comments);
    service.load();
    const cursor = String(post.comments.at(-1)!.order);
    const req = httpTesting.expectOne({ method: 'GET' }, 'Request to get all comments');
    const comments = post.comments.map((vote) => ({ ...vote, id: crypto.randomUUID() }));
    req.flush(comments);
    expect(req.request.url).toBe(`${postsUrl}/${postId}/comments`);
    expect(req.request.params.get('downvote')).toBeNull();
    expect(req.request.params.get('upvote')).toBeNull();
    expect(req.request.params.get('cursor')).toBe(cursor);
    expect(service.list()).toStrictEqual(post.comments.concat(comments));
    httpTesting.verify();
  });
});
