import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { notifications } from './notifications.mock';
import { environment } from '../../environments';
import { Notifications } from './notifications';
import { TestBed } from '@angular/core/testing';
import { Auth } from '../auth';

const authMock = { userUpdated: { subscribe: vi.fn() } };

const url = `${environment.apiUrl}/notifications`;

const setup = () => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: Auth, useValue: authMock },
    ],
  });
  const httpTesting = TestBed.inject(HttpTestingController);
  const service = TestBed.inject(Notifications);
  return { service, httpTesting };
};

describe('Notifications', () => {
  afterEach(vi.resetAllMocks);

  it('should load the notifications', () => {
    const { service, httpTesting } = setup();
    service.load();
    const req = httpTesting.expectOne({ method: 'GET', url }, 'Request to get notifications');
    req.flush(notifications);
    expect(service.list()).toStrictEqual(notifications);
    httpTesting.verify();
  });

  it('should load, reset, and listen to server updates on user-update', () => {
    let socketEventName!: string, socketEventHandler!: () => void;
    const user = {
      socket: { on: vi.fn((name, fn) => ((socketEventName = name), (socketEventHandler = fn))) },
    };
    let callback!: (u: typeof user) => void;
    authMock.userUpdated.subscribe.mockImplementationOnce((fn) => (callback = fn));
    const { service, httpTesting } = setup();
    service.list.set(notifications);
    callback(user);
    expect(service.list()).toStrictEqual([]);
    expect(user.socket.on).toHaveBeenCalledTimes(1);
    expect(socketEventHandler).toBeTypeOf('function');
    expect(socketEventName).toBe('notifications:updated');
    expect(authMock.userUpdated.subscribe).toHaveBeenCalledTimes(1);
    const loadReq = httpTesting.expectOne({ method: 'GET', url }, 'Request to get notifications');
    loadReq.flush(notifications);
    expect(service.list()).toStrictEqual(notifications);
    socketEventHandler();
    const updateReq = httpTesting.expectOne({ method: 'GET' }, 'Request to update notifications');
    updateReq.flush(notifications);
    expect(service.list()).toStrictEqual(notifications);
    expect(updateReq.request.params.get('limit')).toBe('' + notifications.length);
    expect(updateReq.request.url).toBe(url);
    httpTesting.verify();
  });

  it('should update notifications', () => {
    const initList = [notifications[0]];
    const resBody = notifications.slice(0, 2).reverse();
    const finalList = resBody.slice(0).reverse();
    const { service, httpTesting } = setup();
    service.list.set(initList);
    service.update();
    const reqToCancel1 = httpTesting.expectOne({ method: 'GET', url: `${url}?limit=1` });
    service.update();
    const reqToCancel2 = httpTesting.expectOne({ method: 'GET', url: `${url}?limit=1` });
    service.update();
    httpTesting
      .expectOne(
        { method: 'GET', url: `${url}?limit=1` },
        'Request to get current limit of notifications',
      )
      .flush(resBody);
    httpTesting
      .expectOne(
        { method: 'GET', url: `${url}?limit=2` },
        'Request to get extended limit of notifications',
      )
      .flush(resBody);
    expect(reqToCancel1.cancelled).toBe(true);
    expect(reqToCancel2.cancelled).toBe(true);
    expect(service.list()).toStrictEqual(finalList);
    httpTesting.verify();
  });

  it('should mark all notification as seen', () => {
    const { service, httpTesting } = setup();
    service.list.set(notifications.map((n) => ({ ...n, seenAt: null })));
    service.markAsSeen();
    httpTesting
      .expectOne({ method: 'PATCH', url: `${url}/seen` }, 'Request to mark all as seen')
      .flush('');
    expect(service.list().every((n) => typeof n.seenAt === 'string' && Date.parse(n.seenAt))).toBe(
      true,
    );
    httpTesting.verify();
  });

  it('should fail, silently, to mark all notification as seen due to a server error', () => {
    const initialList = notifications.map((n) => ({ ...n, seenAt: null }));
    const { service, httpTesting } = setup();
    service.list.set(initialList);
    service.markAsSeen();
    httpTesting
      .expectOne({ method: 'PATCH', url: `${url}/seen` }, 'Request to mark all as seen')
      .flush('Failed', { status: 500, statusText: 'Internal server error' });
    expect(service.list()).toStrictEqual(initialList);
    httpTesting.verify();
  });

  it('should fail, silently, to mark all notification as seen due to a network error', () => {
    const initialList = notifications.map((n) => ({ ...n, seenAt: null }));
    const error = new ProgressEvent('Network error');
    const { service, httpTesting } = setup();
    service.list.set(initialList);
    service.markAsSeen();
    httpTesting
      .expectOne({ method: 'PATCH', url: `${url}/seen` }, 'Request to mark all as seen')
      .error(error);
    expect(service.list()).toStrictEqual(initialList);
    httpTesting.verify();
  });

  it('should delete a notification that exists in the list', () => {
    let res, err;
    const { id } = notifications[0];
    const { service, httpTesting } = setup();
    service.list.set(notifications);
    service.deleteNotification(id).subscribe({ next: (d) => (res = d), error: (e) => (err = e) });
    httpTesting
      .expectOne({ method: 'DELETE', url: `${url}/${id}` })
      .flush('', { status: 204, statusText: 'No content' });
    expect(service.list()).toStrictEqual(notifications.slice(1));
    expect(err).toBeUndefined();
    expect(res).toBe('');
    httpTesting.verify();
  });

  it('should delete a notification that not exists in the list', () => {
    let res, err;
    const id = crypto.randomUUID();
    const { service, httpTesting } = setup();
    service.list.set(notifications);
    service.deleteNotification(id).subscribe({ next: (d) => (res = d), error: (e) => (err = e) });
    httpTesting
      .expectOne({ method: 'DELETE', url: `${url}/${id}` })
      .flush('', { status: 204, statusText: 'No content' });
    expect(service.list()).toStrictEqual(notifications);
    expect(err).toBeUndefined();
    expect(res).toBe('');
    httpTesting.verify();
  });
});
