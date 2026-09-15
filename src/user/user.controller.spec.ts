import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

describe('UserController', () => {
  let controller: UserController;
  let serviceMock: Partial<Record<string, any>>;

  beforeEach(async () => {
    serviceMock = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: serviceMock }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('calls service.create and returns created user', async () => {
    const dto: CreateUserDto = {
      name: 'Davi',
      phone: '999888777',
      email: 'davi@example.com',
      password: 'senhaXYZ',
      ra: '333444',
    };

    const created = { id: '99', ...dto, password: 'hashed' };

    (serviceMock.create as jest.Mock).mockResolvedValue(created);

    const result = await controller.create(dto);

    expect(serviceMock.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(created);
  });
});
