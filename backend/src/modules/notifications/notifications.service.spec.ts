import {
  asPrisma,
  createPrismaMock,
  type PrismaMock,
} from '../../test-utils/prisma-mock';
import { NotificationsService } from './notifications.service';

const USER = 'user-1';

describe('NotificationsService', () => {
  let prisma: PrismaMock;
  let service: NotificationsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new NotificationsService(asPrisma(prisma));
  });

  describe('createIfAbsent (idempotencia de los jobs)', () => {
    it('crea la notificación cuando no existe una igual (mismo tipo y link)', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);
      prisma.notification.create.mockResolvedValue({ id: 'n1' });

      const result = await service.createIfAbsent(USER, {
        type: 'DUE_DATE',
        message: 'Tarea vencida',
        link: '/tasks?focus=t1',
      });

      expect(prisma.notification.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER, type: 'DUE_DATE', link: '/tasks?focus=t1' },
        }),
      );
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 'n1' });
    });

    it('NO crea (devuelve null) si ya existe una del mismo tipo y link', async () => {
      prisma.notification.findFirst.mockResolvedValue({ id: 'existente' });

      const result = await service.createIfAbsent(USER, {
        type: 'DUE_DATE',
        message: 'Tarea vencida',
        link: '/tasks?focus=t1',
      });

      expect(result).toBeNull();
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('unreadCount / markAllRead', () => {
    it('cuenta las no leídas del usuario', async () => {
      prisma.notification.count.mockResolvedValue(3);

      const result = await service.unreadCount(USER);

      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: USER, read: false },
      });
      expect(result).toEqual({ count: 3 });
    });

    it('markAllRead solo afecta a las no leídas del usuario', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.markAllRead(USER);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: USER, read: false },
        data: { read: true },
      });
      expect(result).toEqual({ updated: 2 });
    });
  });
});
