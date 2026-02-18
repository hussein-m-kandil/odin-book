import { ResolveFn, Routes, TitleStrategy, RouterStateSnapshot } from '@angular/router';
import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { authGuard, userResolver } from './auth';
import { environment } from '../environments';
import { profileResolver } from './profiles';
import { postResolver } from './posts';

const loadProfileList = async () => (await import('./profiles/profile-list')).ProfileList;
const loadDeleteImage = async () => (await import('./images/delete-image')).DeleteImage;
const loadDeleteForm = async () => (await import('./auth/delete-form')).DeleteForm;
const loadImageForm = async () => (await import('./images/image-form')).ImageForm;
const loadAuthForm = async () => (await import('./auth/auth-form')).AuthForm;
const loadProfile = async () => (await import('./profiles/profile')).Profile;
const loadNotFound = async () => (await import('./not-found')).NotFound;
const loadPost = async () => (await import('./posts/post')).Post;
const loadHome = async () => (await import('./home')).Home;

export const routes: Routes = [
  { path: 'not-found', title: 'Not Found', loadComponent: loadNotFound },
  { path: 'signin', canActivate: [authGuard], title: 'Sing In', loadComponent: loadAuthForm },
  { path: 'signup', canActivate: [authGuard], title: 'Sing Up', loadComponent: loadAuthForm },
  {
    path: '',
    canActivate: [authGuard],
    resolve: { user: userResolver },
    children: [
      { path: '', loadComponent: loadHome },
      {
        path: 'posts',
        children: [
          { path: '', loadComponent: loadHome },
          {
            title: 'Post',
            path: ':postId',
            loadComponent: loadPost,
            resolve: { post: postResolver },
          },
        ],
      },
      {
        path: 'followers',
        children: [{ path: '', title: 'Followers', loadComponent: loadProfileList }],
      },
      {
        path: 'following',
        children: [{ path: '', title: 'Following', loadComponent: loadProfileList }],
      },
      {
        path: 'profiles',
        children: [
          { path: '', title: 'Profiles', loadComponent: loadProfileList },
          {
            path: ':profileId/edit',
            title: 'Update Profile',
            resolve: { profile: profileResolver },
            loadComponent: loadAuthForm,
          },
          {
            path: ':profileId/delete',
            title: 'Delete Profile',
            resolve: {
              redirectUrl: ((_, state) =>
                state.url.split('/').slice(0, -1).join('/')) as ResolveFn<string>,
            },
            loadComponent: loadDeleteForm,
          },
          {
            path: ':profileId/pic',
            title: 'Upload Profile Picture',
            resolve: { isAvatar: () => true },
            loadComponent: loadImageForm,
          },
          {
            path: ':profileId/pic/:imageId/delete',
            title: 'Delete Profile Picture',
            resolve: {
              isAvatar: () => true,
              redirectUrl: ((_, state) =>
                state.url.split('/').slice(0, -3).join('/')) as ResolveFn<string>,
            },
            loadComponent: loadDeleteImage,
          },
          {
            path: ':profileId',
            title: 'Profile',
            runGuardsAndResolvers: 'always',
            resolve: { profile: profileResolver },
            loadComponent: loadProfile,
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'not-found' },
];

@Injectable({ providedIn: 'root' })
export class RouteTitleStrategy extends TitleStrategy {
  private readonly _title = inject(Title);
  override updateTitle(snapshot: RouterStateSnapshot): void {
    let routeTitle = this.buildTitle(snapshot);
    if (!routeTitle) {
      // Note: The title of a named outlet is never used; angular.dev/api/router/TitleStrategy
      if (snapshot.url === '/chats') routeTitle = 'Chats';
      if (snapshot.url === '/profiles') routeTitle = 'Profiles';
    }
    this._title.setTitle((routeTitle ? routeTitle + ' | ' : '') + environment.title);
  }
}
