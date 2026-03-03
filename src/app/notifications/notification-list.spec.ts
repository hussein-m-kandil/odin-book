import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { NotificationList } from './notification-list';
import { Notification } from './notifications.types';
import { notifications } from './notifications.mock';
import { Notifications } from './notifications';
import { MessageService } from 'primeng/api';
import { Observable, Subscriber } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { HttpErrorResponse } from '@angular/common/http';

const toastMock = { add: vi.fn() };

const notificationsMock = {
  load: vi.fn(),
  reset: vi.fn(),
  loadError: vi.fn(() => ''),
  loading: vi.fn(() => false),
  hasMore: vi.fn(() => false),
  list: vi.fn<() => unknown[]>(() => []),
  newItems: vi.fn(() => [] as Notification[]),
  deleteNotification: vi.fn(),
  markAsSeen: vi.fn(),
};

const renderComponent = ({
  providers,
  ...options
}: RenderComponentOptions<NotificationList> = {}) => {
  return render(NotificationList, {
    providers: [
      { provide: Notifications, useValue: notificationsMock },
      { provide: MessageService, useValue: toastMock },
      ...(providers || []),
    ],
    autoDetectChanges: false,
    ...options,
  });
};

describe('NotificationList', () => {
  afterEach(vi.resetAllMocks);

  it('should reset, then load the notifications', async () => {
    await renderComponent();
    expect(notificationsMock.reset).toHaveBeenCalledTimes(1);
    expect(notificationsMock.load).toHaveBeenCalledTimes(1);
  });

  it('should not reset, nor load the notifications if it is currently loading', async () => {
    notificationsMock.loading.mockImplementation(() => true);
    await renderComponent();
    expect(notificationsMock.reset).toHaveBeenCalledTimes(0);
    expect(notificationsMock.load).toHaveBeenCalledTimes(0);
  });

  it('should not reset, nor load the notifications if it is not empty', async () => {
    notificationsMock.list.mockImplementation(() => notifications);
    await renderComponent();
    expect(notificationsMock.reset).toHaveBeenCalledTimes(0);
    expect(notificationsMock.load).toHaveBeenCalledTimes(0);
  });

  it('should display a list of notifications', async () => {
    notificationsMock.list.mockImplementation(() => notifications);
    await renderComponent();
    expect(screen.getByRole('list')).toBeVisible();
    expect(screen.getByRole('list', { name: /notification/i })).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(notifications.length);
    expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(notifications.length);
    expect(screen.getAllByRole('link')).toHaveLength(notifications.length * 2); // 1 profile + 1 content
    expect(screen.getAllByRole('img')).toHaveLength(notifications.length);
    for (const { header, description, profileName } of notifications) {
      const preparedHeader = header
        .replace(/upvote/g, 'like')
        .replace(/Upvote/g, 'Like')
        .replace(/downvote/g, 'dislike')
        .replace(/Downvote/g, 'Dislike')
        .replace(
          new RegExp(profileName, 'g'),
          `@${profileName.length > 16 ? profileName.slice(0, 16) + '...' : profileName}`,
        );
      const preparedDescription = (description || '').slice(0, 24).replace(/\.+$/, '');
      const contentRegex = new RegExp(`${preparedHeader}.+${preparedDescription}...`, 'i');
      expect(screen.getByRole('link', { name: contentRegex })).toBeVisible();
    }
  });

  it('should not mark the notifications as seen if there are not any new items', async () => {
    notificationsMock.newItems.mockImplementation(() => []);
    await renderComponent();
    expect(notificationsMock.markAsSeen).toHaveBeenCalledTimes(0);
  });

  it('should mark the notifications as seen if there are some new items', async () => {
    vi.useFakeTimers();
    notificationsMock.newItems.mockImplementation(() => notifications);
    await renderComponent();
    expect(notificationsMock.markAsSeen).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(1500);
    expect(notificationsMock.markAsSeen).toHaveBeenCalledTimes(1);
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('should try to delete the notification when clicking the delete button', async () => {
    let sub!: Subscriber<void>;
    notificationsMock.deleteNotification.mockImplementation(() => new Observable((s) => (sub = s)));
    notificationsMock.list.mockImplementation(() => notifications);
    const actor = userEvent.setup();
    const { detectChanges } = await renderComponent();
    const delBtns = screen.getAllByRole('button', { name: /delete/i });
    let i = 0;
    for (const delBtn of delBtns) {
      expect(delBtn).toBeEnabled();
      await actor.click(delBtn);
      delBtns.forEach((btn) => {
        if (btn === delBtn) {
          expect(btn).toHaveClass(/loading/i);
          expect(btn).toBeDisabled();
        } else {
          expect(btn).toBeEnabled();
          expect(btn).not.toHaveClass(/loading/i);
        }
      });
      if (i % 2 === 0) {
        sub.next();
        sub.complete();
        expect(toastMock.add).toHaveBeenCalledTimes(0);
      } else {
        sub.error(new HttpErrorResponse({ status: 500, statusText: 'Internal server error' }));
        expect(toastMock.add).toHaveBeenCalledTimes(1);
        toastMock.add.mockClear();
      }
      detectChanges();
      expect(delBtn).toBeEnabled();
      expect(delBtn).not.toHaveClass(/loading/i);
      i++;
    }
    expect(notificationsMock.deleteNotification).toHaveBeenCalledTimes(notifications.length);
  });
});
