import { asyncScheduler, Observable, observeOn, of, Subscriber, throwError } from 'rxjs';
import { HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, input, output, OutputEmitterRef, Provider } from '@angular/core';
import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { ReactiveFormsModule } from '@angular/forms';
import { ColorScheme } from '../../../color-scheme';
import { NewPostData } from '../../posts.types';
import { ImagePicker } from '../../../images';
import { MessageService } from 'primeng/api';
import { ContentForm } from './content-form';
import { Textarea } from 'primeng/textarea';
import { Popover } from 'primeng/popover';
import { Button } from 'primeng/button';
import { post } from '../../posts.mock';
import { Comments } from '../comments';
import { Posts } from '../../posts';
import { Menu } from 'primeng/menu';
import { Mock } from 'vitest';

const toastMock = { add: vi.fn() };

const postsMock = { createPost: vi.fn() };

const commentsMock = { createComment: vi.fn() };

const commonProviders: Provider[] = [
  { provide: ColorScheme, useValue: { selectedScheme: vi.fn(() => ({ value: 'light' })) } },
  { provide: MessageService, useValue: toastMock },
  { provide: Comments, useValue: commentsMock },
  { provide: Posts, useValue: postsMock },
];

const renderComponent = ({ providers, ...options }: RenderComponentOptions<ContentForm> = {}) => {
  return render(ContentForm, {
    providers: [...commonProviders, ...(providers || [])],
    autoDetectChanges: false,
    ...options,
  });
};

describe('ContentForm', () => {
  afterEach(vi.resetAllMocks);

  const testData: {
    inputs: { commentPostId?: string };
    type: 'post' | 'comment';
    createMock: Mock;
  }[] = [
    { type: 'post', inputs: {}, createMock: postsMock.createPost },
    { type: 'comment', inputs: { commentPostId: post.id }, createMock: commentsMock.createComment },
  ];

  for (const { type, createMock, inputs } of testData) {
    const name = new RegExp(type, 'i');

    describe(`Create ${type}`, () => {
      it('should display a form with fields', async () => {
        await renderComponent({ inputs });
        expect(screen.getByRole('form', { name })).toBeVisible();
        expect(screen.getByRole('button', { name })).toBeVisible();
        expect(screen.getByRole('textbox', { name })).toBeVisible();
        if (type === 'post') {
          expect(screen.getByRole('button', { name: /public/i })).toBeVisible();
          expect(screen.getByRole('button', { name: /toggle image picker/i })).toBeVisible();
          expect(screen.getByRole('button', { name: /toggle emoji picker/i })).toBeVisible();
        }
      });

      it('should toggle an emoji picker', async () => {
        await renderComponent({ inputs });
        const actor = userEvent.setup();
        const contentInp = screen.getByRole('textbox', { name });
        const emojiPickerBtn = screen.getByRole('button', { name: /toggle emoji picker/i });
        expect(screen.queryByLabelText(/^emoji picker/i)).toBeNull();
        await actor.click(emojiPickerBtn);
        expect(screen.getByLabelText(/^emoji picker/i)).toBeVisible();
        expect(contentInp).not.toHaveFocus();
        await actor.click(emojiPickerBtn);
        expect(screen.queryByLabelText(/^emoji picker/i)).toBeNull();
      });

      it('should insert the picked emoji at the cart place of the message textbox', async () => {
        const actor = userEvent.setup();
        let pickedOutputMock!: OutputEmitterRef<unknown>;
        @Component({
          selector: 'app-emoji-picker',
          template: `<div aria-label="Emoji Picker"></div>`,
        })
        class EmojiPicker {
          readonly theme = input<string>();
          readonly picked = output<unknown>();
          constructor() {
            pickedOutputMock = this.picked;
          }
        }
        const { detectChanges } = await render(ContentForm, {
          componentImports: [
            ReactiveFormsModule,
            ImagePicker,
            EmojiPicker,
            Textarea,
            Popover,
            Button,
            Menu,
          ],
          providers: commonProviders,
          autoDetectChanges: false,
          inputs,
        });
        const contentInp = screen.getByRole('textbox', { name });
        const emojiPickerBtn = screen.getByRole('button', { name: /toggle emoji picker/i });
        const textValue = 'Hello, Emojis!';
        await actor.type(contentInp, textValue);
        await actor.click(emojiPickerBtn);
        detectChanges();
        pickedOutputMock.emit({ native: '😎' });
        await actor.pointer([
          { target: contentInp, offset: 5, keys: '[MouseLeft>]' },
          { offset: 7 },
        ]);
        if (!screen.queryByLabelText(/^emoji picker/i)) {
          await actor.click(emojiPickerBtn);
          detectChanges();
        }
        pickedOutputMock.emit({ native: '😌' });
        await actor.pointer({ target: contentInp, offset: 13, keys: '[MouseLeft]' });
        if (!screen.queryByLabelText(/^emoji picker/i)) {
          await actor.click(emojiPickerBtn);
          detectChanges();
        }
        pickedOutputMock.emit({ native: '🤡' });
        pickedOutputMock.emit({ native: '🎉' });
        expect(contentInp).toHaveValue('Hello😌Emojis🤡🎉!😎');
      });

      it('should close the emoji picker', async () => {
        const actor = userEvent.setup();
        let closedOutputMock!: OutputEmitterRef<void>;
        @Component({
          selector: 'app-emoji-picker',
          template: `<div aria-label="Emoji Picker"></div>`,
        })
        class EmojiPicker {
          readonly theme = input<string>();
          readonly closed = output();
          constructor() {
            closedOutputMock = this.closed;
          }
        }
        const { detectChanges } = await render(ContentForm, {
          componentImports: [
            ReactiveFormsModule,
            ImagePicker,
            EmojiPicker,
            Textarea,
            Popover,
            Button,
            Menu,
          ],
          providers: commonProviders,
          autoDetectChanges: false,
          inputs,
        });
        const emojiPickerBtn = screen.getByRole('button', { name: /toggle emoji picker/i });
        expect(screen.queryByLabelText(/^emoji picker/i)).toBeNull();
        await actor.click(emojiPickerBtn);
        expect(screen.getByLabelText(/^emoji picker/i)).toBeVisible();
        closedOutputMock.emit();
        detectChanges();
        expect(screen.queryByLabelText(/^emoji picker/i)).toBeNull();
      });

      it('should create', async () => {
        let sub!: Subscriber<unknown>;
        createMock.mockImplementation(() => new Observable((s) => (sub = s)));
        const actor = userEvent.setup();
        await renderComponent({ inputs });
        const content = 'Foo bar tar baz...!';
        const newPostData = { content, published: true, image: null };
        const submitBtn = screen.getByRole('button', { name });
        const contentInp = screen.getByRole('textbox', { name });
        await actor.type(contentInp, content);
        await actor.click(submitBtn);
        expect(contentInp).toBeDisabled();
        expect(submitBtn).toBeDisabled();
        sub.next(type === 'post' ? new HttpResponse({ status: 201 }) : post.comments[0]);
        sub.complete();
        if (type === 'post') expect(createMock).toHaveBeenCalledExactlyOnceWith(newPostData);
        else expect(createMock).toHaveBeenCalledExactlyOnceWith(post.id, { content });
        expect(contentInp).toHaveValue('');
      });

      it('should not submit again while submitting', async () => {
        createMock.mockImplementation(() =>
          of(new HttpResponse({ status: 201 })).pipe(observeOn(asyncScheduler, 700)),
        );
        const actor = userEvent.setup();
        await renderComponent({ inputs });
        const content = 'Foo bar tar baz...!';
        const newPostData = { content, published: true, image: null };
        const submitBtn = screen.getByRole('button', { name });
        const contentInp = screen.getByRole('textbox', { name });
        await actor.type(contentInp, content);
        await actor.click(submitBtn);
        if (type === 'post') expect(createMock).toHaveBeenCalledExactlyOnceWith(newPostData);
        else expect(createMock).toHaveBeenCalledExactlyOnceWith(post.id, { content });
        expect(contentInp).toHaveValue(content);
        expect(submitBtn).toBeDisabled();
        expect(submitBtn).toHaveFocus();
      });

      it('should display a toast error message', async () => {
        createMock.mockImplementation(() => throwError(() => new Error('Test error')));
        const actor = userEvent.setup();
        await renderComponent({ inputs });
        const content = 'Foo bar tar baz...!';
        const newPostData = { content, published: true, image: null };
        const submitBtn = screen.getByRole('button', { name });
        const contentInp = screen.getByRole('textbox', { name });
        await actor.type(contentInp, content);
        await actor.click(submitBtn);
        if (type === 'post') expect(createMock).toHaveBeenCalledExactlyOnceWith(newPostData);
        else expect(createMock).toHaveBeenCalledExactlyOnceWith(post.id, { content });
        expect(toastMock.add).toHaveBeenCalledOnce();
        expect(toastMock.add.mock.calls[0][0]).toHaveProperty('detail');
        expect(toastMock.add.mock.calls[0][0]).toHaveProperty('summary');
        expect(toastMock.add.mock.calls[0][0]).toHaveProperty('severity', 'error');
      });

      it('should display a toast backend-error message', async () => {
        const errRes = new HttpErrorResponse({
          error: { error: { message: 'Bad request' } },
          statusText: 'Bad request',
          status: 400,
        });
        createMock.mockImplementation(() => throwError(() => errRes));
        const actor = userEvent.setup();
        await renderComponent({ inputs });
        const content = 'Foo bar tar baz...!';
        const newPostData = { content, published: true, image: null };
        const submitBtn = screen.getByRole('button', { name });
        const contentInp = screen.getByRole('textbox', { name });
        await actor.type(contentInp, content);
        await actor.click(submitBtn);
        if (type === 'post') expect(createMock).toHaveBeenCalledExactlyOnceWith(newPostData);
        else expect(createMock).toHaveBeenCalledExactlyOnceWith(post.id, { content });
        expect(toastMock.add).toHaveBeenCalledOnce();
        expect(toastMock.add.mock.calls[0][0]).toHaveProperty('detail');
        expect(toastMock.add.mock.calls[0][0]).toHaveProperty('summary');
        expect(toastMock.add.mock.calls[0][0]).toHaveProperty('severity', 'error');
      });

      if (type === 'post') {
        it('should toggle an image picker', async () => {
          await renderComponent({ inputs });
          const actor = userEvent.setup();
          const contentInp = screen.getByRole('textbox', { name });
          const imagePickerBtn = screen.getByRole('button', { name: /toggle image picker/i });
          expect(screen.queryByRole('button', { name: /pick .*image/i })).toBeNull();
          expect(screen.queryByLabelText(/browse files/i)).toBeNull();
          expect(screen.queryByRole('progressbar')).toBeNull();
          await actor.click(imagePickerBtn);
          expect(screen.getByRole('button', { name: /pick .*image/i })).toBeVisible();
          expect(screen.getByLabelText(/browse files/i)).toBeInTheDocument();
          expect(screen.getByRole('progressbar')).toHaveValue(0);
          expect(contentInp).not.toHaveFocus();
          await actor.click(imagePickerBtn);
          expect(screen.queryByRole('button', { name: /pick .*image/i })).toBeNull();
          expect(screen.queryByLabelText(/browse files/i)).toBeNull();
          expect(screen.queryByRole('progressbar')).toBeNull();
        });

        it('should switch between the pickers when opening one while the other one is open', async () => {
          await renderComponent({ inputs });
          const actor = userEvent.setup();
          const contentInp = screen.getByRole('textbox', { name });
          const imagePickerBtn = screen.getByRole('button', { name: /toggle image picker/i });
          const emojiPickerBtn = screen.getByRole('button', { name: /toggle emoji picker/i });
          expect(screen.queryByRole('button', { name: /pick .*image/i })).toBeNull();
          expect(screen.queryByLabelText(/^emoji picker/i)).toBeNull();
          expect(screen.queryByLabelText(/browse files/i)).toBeNull();
          await actor.click(emojiPickerBtn);
          expect(screen.queryByRole('button', { name: /pick .*image/i })).toBeNull();
          expect(screen.getByLabelText(/^emoji picker/i)).toBeVisible();
          expect(screen.queryByLabelText(/browse files/i)).toBeNull();
          expect(contentInp).not.toHaveFocus();
          await actor.click(imagePickerBtn);
          expect(screen.getByRole('button', { name: /pick .*image/i })).toBeVisible();
          expect(screen.getByLabelText(/browse files/i)).toBeInTheDocument();
          expect(screen.queryByLabelText(/^emoji picker/i)).toBeNull();
          expect(contentInp).not.toHaveFocus();
          await actor.click(emojiPickerBtn);
          expect(screen.queryByRole('button', { name: /pick .*image/i })).toBeNull();
          expect(screen.getByLabelText(/^emoji picker/i)).toBeVisible();
          expect(screen.queryByLabelText(/browse files/i)).toBeNull();
          expect(contentInp).not.toHaveFocus();
          await actor.click(imagePickerBtn);
          expect(screen.getByRole('button', { name: /pick .*image/i })).toBeVisible();
          expect(screen.getByLabelText(/browse files/i)).toBeInTheDocument();
          expect(screen.queryByLabelText(/^emoji picker/i)).toBeNull();
          expect(contentInp).not.toHaveFocus();
          await actor.click(imagePickerBtn);
          expect(screen.queryByRole('button', { name: /pick .*image/i })).toBeNull();
          expect(screen.queryByLabelText(/^emoji picker/i)).toBeNull();
          expect(screen.queryByLabelText(/browse files/i)).toBeNull();
        });

        it('should should display privacy options menu', async () => {
          const actor = userEvent.setup();
          await renderComponent({ inputs });
          await actor.click(screen.getByRole('button', { name: /public/i }));
          await vi.waitFor(() => screen.getByRole('menu'));
          expect(screen.getByRole('menu', { name: /privacy/i })).toBeVisible();
          expect(screen.getByRole('menuitem', { name: /public/i })).toBeVisible();
          expect(screen.getByRole('menuitem', { name: /private/i })).toBeVisible();
        });

        it('should should switch to private post', async () => {
          const actor = userEvent.setup();
          await renderComponent({ inputs });
          await actor.click(screen.getByRole('button', { name: /public/i }));
          await vi.waitFor(() => screen.getByRole('menu'));
          await actor.click(screen.getByText(/private/i));
          await vi.waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
          expect(screen.getByRole('button', { name: /private/i })).toBeVisible();
          expect(screen.queryByRole('button', { name: /public/i })).toBeNull();
        });

        it('should create a private post', async () => {
          let sub!: Subscriber<unknown>;
          createMock.mockImplementation(() => new Observable((s) => (sub = s)));
          const actor = userEvent.setup();
          await renderComponent({ inputs });
          await actor.click(screen.getByRole('button', { name: /public/i }));
          await vi.waitFor(() => screen.getByRole('menu'));
          await actor.click(screen.getByText(/private/i));
          await vi.waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
          const newPostData = { content: 'Foo bar tar baz...!', published: false, image: null };
          const submitBtn = screen.getByRole('button', { name });
          const contentInp = screen.getByRole('textbox', { name });
          await actor.type(contentInp, newPostData.content);
          await actor.click(submitBtn);
          expect(contentInp).toBeDisabled();
          expect(submitBtn).toBeDisabled();
          sub.next(new HttpResponse({ status: 201 }));
          sub.complete();
          expect(createMock).toHaveBeenCalledExactlyOnceWith(newPostData);
          expect(contentInp).toHaveValue('');
        });

        it('should create post with an image', async () => {
          let sub!: Subscriber<unknown>;
          createMock.mockImplementation(() => new Observable((s) => (sub = s)));
          const newPostData: NewPostData = {
            image: new File([], 'img.png', { type: 'image/png' }),
            content: 'Foo bar tar baz...!',
            published: true,
          };
          const actor = userEvent.setup();
          const { detectChanges } = await renderComponent({ inputs });
          const submitBtn = screen.getByRole('button', { name });
          const contentInp = screen.getByRole('textbox', { name });
          const imagePickerBtn = screen.getByRole('button', { name: /toggle image picker/i });
          await actor.click(imagePickerBtn);
          const fileInp = screen.getByLabelText(/browse files/i);
          await actor.upload(fileInp, newPostData.image!);
          await actor.type(contentInp, newPostData.content);
          await actor.click(submitBtn);
          expect(contentInp).toBeDisabled();
          expect(submitBtn).toBeDisabled();
          expect(fileInp).toBeDisabled();
          expect(imagePickerBtn).toBeDisabled();
          sub.next({ type: HttpEventType.UploadProgress, loaded: 3.5, total: 10 });
          detectChanges();
          expect(screen.getByRole('progressbar')).toHaveValue(35);
          sub.next(new HttpResponse({ status: 201 }));
          sub.complete();
          expect(createMock).toHaveBeenCalledExactlyOnceWith(newPostData);
          detectChanges();
          expect(screen.queryByRole('button', { name: /pick .*image/i })).toBeNull();
          expect(screen.queryByLabelText(/browse files/i)).toBeNull();
          expect(contentInp).toHaveValue('');
          await actor.click(imagePickerBtn);
          expect(screen.getByLabelText(/browse files/i)).toHaveValue('');
          expect(screen.getByRole('progressbar')).toHaveValue(0);
        });

        it('should create a private post with an image', async () => {
          let sub!: Subscriber<unknown>;
          createMock.mockImplementation(() => new Observable((s) => (sub = s)));
          const actor = userEvent.setup();
          const { detectChanges } = await renderComponent({ inputs });
          await actor.click(screen.getByRole('button', { name: /public/i }));
          await vi.waitFor(() => screen.getByRole('menu'));
          await actor.click(screen.getByText(/private/i));
          await vi.waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
          const newPostData: NewPostData = {
            image: new File([], 'img.png', { type: 'image/png' }),
            content: 'Foo bar tar baz...!',
            published: false,
          };
          const submitBtn = screen.getByRole('button', { name });
          const contentInp = screen.getByRole('textbox', { name });
          const imagePickerBtn = screen.getByRole('button', { name: /toggle image picker/i });
          await actor.click(imagePickerBtn);
          const fileInp = screen.getByLabelText(/browse files/i);
          await actor.upload(fileInp, newPostData.image!);
          await actor.type(contentInp, newPostData.content);
          await actor.click(submitBtn);
          expect(contentInp).toBeDisabled();
          expect(submitBtn).toBeDisabled();
          expect(fileInp).toBeDisabled();
          expect(imagePickerBtn).toBeDisabled();
          sub.next({ type: HttpEventType.UploadProgress, loaded: 3.5, total: 10 });
          detectChanges();
          expect(screen.getByRole('progressbar')).toHaveValue(35);
          sub.next(new HttpResponse({ status: 201 }));
          sub.complete();
          expect(createMock).toHaveBeenCalledExactlyOnceWith(newPostData);
          expect(contentInp).toHaveValue('');
          await actor.click(imagePickerBtn);
          expect(screen.getByLabelText(/browse files/i)).toHaveValue('');
          expect(screen.getByRole('progressbar')).toHaveValue(0);
        });

        it('should display image-upload error toast', async () => {
          let sub!: Subscriber<unknown>;
          createMock.mockImplementation(() => new Observable((s) => (sub = s)));
          const newPostData: NewPostData = {
            image: new File([], 'img.png', { type: 'image/png' }),
            content: 'Foo bar tar baz...!',
            published: true,
          };
          const actor = userEvent.setup();
          const { detectChanges } = await renderComponent({ inputs });
          const submitBtn = screen.getByRole('button', { name });
          const contentInp = screen.getByRole('textbox', { name });
          const imagePickerBtn = screen.getByRole('button', { name: /toggle image picker/i });
          await actor.click(imagePickerBtn);
          const fileInp = screen.getByLabelText(/browse files/i);
          await actor.upload(fileInp, newPostData.image!);
          await actor.type(contentInp, newPostData.content);
          await actor.click(submitBtn);
          expect(contentInp).toBeDisabled();
          expect(submitBtn).toBeDisabled();
          expect(fileInp).toBeDisabled();
          expect(imagePickerBtn).toBeDisabled();
          sub.next({ type: HttpEventType.UploadProgress, loaded: 3.5, total: 10 });
          detectChanges();
          expect(screen.getByRole('progressbar')).toHaveValue(35);
          sub.error(new Error('Test error'));
          expect(createMock).toHaveBeenCalledExactlyOnceWith(newPostData);
          detectChanges();
          expect(screen.getByRole('button', { name: /^pick .*image/i })).toBeVisible();
          expect(screen.getByLabelText(/browse files/i)).toBeInTheDocument();
          expect(screen.getByRole('progressbar')).toHaveValue(0);
          expect(contentInp).toHaveValue(newPostData.content);
          expect(toastMock.add).toHaveBeenCalledOnce();
          expect(toastMock.add.mock.calls[0][0]).toHaveProperty('detail');
          expect(toastMock.add.mock.calls[0][0]).toHaveProperty('summary');
          expect(toastMock.add.mock.calls[0][0]).toHaveProperty('severity', 'error');
        });
      }
    });
  }
});
