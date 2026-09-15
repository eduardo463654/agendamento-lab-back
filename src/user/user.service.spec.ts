/* eslint-disable @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/require-await,
  @typescript-eslint/no-unsafe-assignment */

// Mock do cliente Prisma gerado para evitar resolução de import ESM durante os testes
jest.mock('../../generated/prisma/client', () => {
  const mocked = {
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

  return mocked;
});

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import bcrypt from 'bcrypt';

import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

describe('UserService', () => {
  let service: UserService;
  let prismaMock: Partial<Record<string, any>>;

  beforeEach(async () => {
    prismaMock = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a user and hashes the password', async () => {
    const dto: CreateUserDto = {
      name: 'Alice',
      phone: '123456789',
      email: 'alice@example.com',
      password: 'senhaSegura',
      ra: '123456',
    };

    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

    // Echo back created data so we can inspect the hashed password
    (prismaMock.user.create as jest.Mock).mockImplementation(
      async ({ data }) => ({ id: '1', ...data }),
    );

    const created = await service.create(dto);

    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(created).toHaveProperty('id');
    expect(created.email).toBe(dto.email);
    // senha não deve ser igual ao texto puro
    expect(created.password).not.toBe(dto.password);
    // verificar que a senha foi realmente hasheada
    const isMatch = bcrypt.compareSync(dto.password, created.password);
    expect(isMatch).toBeTruthy();
  });

  it('throws ConflictException if email already exists', async () => {
    const dto: CreateUserDto = {
      name: 'Bob',
      phone: '987654321',
      email: 'bob@example.com',
      password: 'senha1234',
      ra: '654321',
    };

    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
      id: '42',
      email: dto.email,
    });

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws ConflictException when Prisma returns P2002 (RA unique)', async () => {
    const dto: CreateUserDto = {
      name: 'Carol',
      phone: '111222333',
      email: 'carol@example.com',
      password: 'senhaabcd',
      ra: '777777',
    };

    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

    // criar um objeto que seja instanceof PrismaClientKnownRequestError
    const prismaErr = Object.create(PrismaClientKnownRequestError.prototype);
    prismaErr.code = 'P2002';

    (prismaMock.user.create as jest.Mock).mockImplementation(async () => {
      throw prismaErr;
    });

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });
});
