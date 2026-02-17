import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { postResolver } from './post-resolver';
import { Post } from './posts.types';
import { Posts } from './posts';

const postsMock = { getPost: vi.fn() };

const setup = () => {
  const executeResolver: ResolveFn<Post> = (...resolverParameters) =>
    TestBed.runInInjectionContext(() => postResolver(...resolverParameters));

  TestBed.configureTestingModule({ providers: [{ provide: Posts, useValue: postsMock }] });

  return { executeResolver };
};

const createResolverArgs = (firstArg = {}, secondArg = {}) => {
  return [firstArg as ActivatedRouteSnapshot, secondArg as RouterStateSnapshot] as const;
};

describe('postResolver', () => {
  afterEach(vi.resetAllMocks);

  it('should return an observer of a post', async () => {
    const post = { id: crypto.randomUUID(), foo: 'bar' };
    postsMock.getPost.mockImplementation(() => of(post));
    const { executeResolver } = setup();
    const result$ = executeResolver(...createResolverArgs({ params: { postId: post.id } }));
    const result = isObservable(result$) ? await firstValueFrom(result$) : await result$;
    expect(postsMock.getPost).toHaveBeenCalledExactlyOnceWith(post.id);
    expect(result).toBe(post);
  });

  it('should throw if the `params` missing a `postId`', async () => {
    const { executeResolver } = setup();
    expect(() => executeResolver(...createResolverArgs({ params: {} }))).toThrowError(
      /missing .*post ?id/i,
    );
  });
});
