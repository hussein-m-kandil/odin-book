import {
  input,
  signal,
  inject,
  Injector,
  Component,
  viewChild,
  DestroyRef,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { HttpEventType, HttpUploadProgressEvent } from '@angular/common/http';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { EmojiPicker, PickedEmoji } from '../../../emoji-picker';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ImagePicker } from '../../../images/image-picker';
import { MenuItem, MessageService } from 'primeng/api';
import { ColorScheme } from '../../../color-scheme';
import { getResErrMsg } from '../../../utils';
import { Textarea } from 'primeng/textarea';
import { Popover } from 'primeng/popover';
import { Post } from '../../posts.types';
import { Button } from 'primeng/button';
import { Comments } from '../comments';
import { Posts } from '../../posts';
import { Menu } from 'primeng/menu';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-content-form',
  imports: [ReactiveFormsModule, ImagePicker, EmojiPicker, Textarea, Popover, Button, Menu],
  templateUrl: './content-form.html',
  styles: ``,
})
export class ContentForm {
  private readonly _contentInput = viewChild.required<ElementRef<HTMLTextAreaElement>>('content');
  private readonly _privacyPopover = viewChild.required<Popover>('privacyPopover');
  private readonly _pickerPopover = viewChild.required<Popover>('pickerPopover');
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _injector = inject(Injector);

  private readonly _toast = inject(MessageService);
  private readonly _comments = inject(Comments);
  private readonly _posts = inject(Posts);

  protected readonly colorScheme = inject(ColorScheme);

  protected readonly form = new FormGroup({ content: new FormControl('', { nonNullable: true }) });

  protected readonly progress = signal<HttpUploadProgressEvent | null>(null);
  protected readonly picking = signal<'image' | 'emoji' | null>(null);
  protected readonly pickedImage = signal<File | null>(null);
  protected readonly privacyIndex = signal(1);

  protected readonly privacyOptions: MenuItem[] = [
    { icon: 'pi pi-lock', label: 'Private', command: () => this.setPrivacy(0) },
    { icon: 'pi pi-globe', label: 'Public', command: () => this.setPrivacy(1) },
  ];

  readonly commentPostId = input<Post['id']>();

  protected setPrivacy(privacy: 0 | 1) {
    this.privacyIndex.set(privacy);
    this._privacyPopover().hide();
  }

  protected unpickImage() {
    this.pickedImage.set(null);
    this.progress.set(null);
  }

  protected hidePicker(picker: 'image' | 'emoji' | 'any') {
    if (picker === 'any' || picker === this.picking()) this.picking.set(null);
    if (picker !== 'image') this._pickerPopover().hide();
  }

  protected togglePicker(picker: 'image' | 'emoji', event?: Event) {
    this._privacyPopover()?.hide();
    this.picking.update((picking) => {
      if (picking !== picker) return picker;
      if (picker === 'image') this.unpickImage();
      return null;
    });
    const pickerPopover = this._pickerPopover();
    if (this.picking()) pickerPopover.show(event);
    else pickerPopover.hide();
  }

  protected insertPickedEmoji(emoji: PickedEmoji) {
    const { nativeElement: contentInput } = this._contentInput();
    const splittedValue = contentInput.value.split('');
    const insertionIndex = contentInput.selectionStart;
    const nextInsertionIndex = insertionIndex + emoji.native.length;
    const replacedCharsCount = contentInput.selectionEnd - contentInput.selectionStart;
    splittedValue.splice(insertionIndex, replacedCharsCount, emoji.native);
    this.form.controls.content.setValue(splittedValue.join(''));
    contentInput.focus();
    contentInput.selectionEnd = nextInsertionIndex;
    contentInput.selectionStart = nextInsertionIndex;
    contentInput.blur();
  }

  protected reset() {
    this.hidePicker('any');
    this.setPrivacy(1);
    this.unpickImage();
    this.form.reset();
  }

  protected handleSuccess() {
    this.reset();
  }

  protected handleFailure(action: 'Post' | 'Comment', res: unknown) {
    this._toast.add({
      detail: getResErrMsg(res) || `Failed to create your ${action.toLowerCase()}.`,
      summary: `${action} failed`,
      severity: 'error',
    });
    afterNextRender(() => this._contentInput().nativeElement.focus(), { injector: this._injector });
  }

  protected submit() {
    this.form.markAllAsDirty();
    const image = this.pickedImage();
    const { content } = this.form.getRawValue();
    if ((this.form.enabled && content) || image) {
      this.form.disable();
      const postId = this.commentPostId();
      const finalizeSubmission = () => (this.progress.set(null), this.form.enable());
      if (postId) {
        this._comments
          .createComment(postId, { content })
          .pipe(takeUntilDestroyed(this._destroyRef), finalize(finalizeSubmission))
          .subscribe({
            next: () => this.handleSuccess(),
            error: (res) => this.handleFailure('Comment', res),
          });
      } else {
        this._posts
          .createPost({ image, content, published: !!this.privacyIndex() })
          .pipe(takeUntilDestroyed(this._destroyRef), finalize(finalizeSubmission))
          .subscribe({
            next: (event) => {
              switch (event.type) {
                case HttpEventType.UploadProgress:
                  this.progress.set(event);
                  break;
                case HttpEventType.Response:
                  this.handleSuccess();
                  break;
              }
            },
            error: (res) => this.handleFailure('Post', res),
          });
      }
    }
  }

  protected showScrollbarAsNeeded() {
    const msgInp = this._contentInput().nativeElement;
    const msgInpMsxHeight = parseFloat(getComputedStyle(msgInp).maxHeight);
    msgInp.style.overflow = msgInp.scrollHeight > msgInpMsxHeight ? 'auto' : '';
  }
}
