// Mock global do cliente Prisma gerado para testes
// Este arquivo é carregado via jest `setupFiles` para evitar que o Jest tente
// resolver os imports `.js` gerados pelo Prisma em tempo de teste.

jest.mock('../generated/prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    })),
  };
});
