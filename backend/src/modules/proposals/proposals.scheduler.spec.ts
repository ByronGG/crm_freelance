import { NotificationsService } from '../notifications/notifications.service';
import { ProposalsService } from './proposals.service';
import { ProposalsScheduler } from './proposals.scheduler';

describe('ProposalsScheduler (seguimiento de propuestas enviadas)', () => {
  let proposals: { findStaleSent: jest.Mock };
  let notifications: { createIfAbsent: jest.Mock };
  let scheduler: ProposalsScheduler;

  beforeEach(() => {
    proposals = { findStaleSent: jest.fn().mockResolvedValue([]) };
    notifications = {
      createIfAbsent: jest.fn().mockResolvedValue({ id: 'n' }),
    };
    scheduler = new ProposalsScheduler(
      proposals as unknown as ProposalsService,
      notifications as unknown as NotificationsService,
    );
  });

  it('avisa (REMINDER con link a la propuesta) por cada propuesta estancada', async () => {
    proposals.findStaleSent.mockResolvedValue([
      { id: 'p1', ownerId: 'owner-1', title: 'Web' },
      { id: 'p2', ownerId: 'owner-2', title: 'App' },
    ]);

    await scheduler.run();

    expect(notifications.createIfAbsent).toHaveBeenCalledTimes(2);
    expect(notifications.createIfAbsent).toHaveBeenCalledWith(
      'owner-1',
      expect.objectContaining({
        type: 'REMINDER',
        link: '/proposals?focus=p1',
      }),
    );
  });

  it('usa un corte de días atrás al buscar propuestas enviadas', async () => {
    await scheduler.run();

    const cutoff = proposals.findStaleSent.mock.calls[0][0] as Date;
    expect(cutoff.getTime()).toBeLessThan(Date.now());
    expect(notifications.createIfAbsent).not.toHaveBeenCalled();
  });
});
