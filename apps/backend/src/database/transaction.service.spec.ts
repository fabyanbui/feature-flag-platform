import { TransactionService } from './transaction.service';

describe('TransactionService', () => {
  const tx = {
    kind: 'transaction-client',
  };

  const prisma = {
    $transaction: jest.fn(),
  };

  let service: TransactionService;

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    service = new TransactionService(prisma as never);
  });

  it('calls prisma transaction', async () => {
    await service.run(async () => 'done');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('passes transaction client to callback', async () => {
    const callback = jest.fn().mockResolvedValue('done');

    await service.run(callback);

    expect(callback).toHaveBeenCalledWith(tx);
  });

  it('returns callback result', async () => {
    await expect(service.run(async () => 'done')).resolves.toBe('done');
  });

  it('propagates callback errors', async () => {
    await expect(
      service.run(async () => {
        throw new Error('transaction failed');
      }),
    ).rejects.toThrow('transaction failed');
  });
});
