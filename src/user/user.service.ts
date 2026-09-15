import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}

  async create(createUserData: CreateUserDto) {
    const userAlreadyExists = await this.findByEmail(createUserData.email);

    if (userAlreadyExists) {
      throw new ConflictException('E-mail já cadastrado!');
    }

    const saltsOrRounds = 10;

    try {
      const user = await this.prismaService.user.create({
        data: {
          ...createUserData,
          password: bcrypt.hashSync(createUserData.password, saltsOrRounds),
        },
      });

      return user;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('RA já cadastrado!');
      }

      throw error;
    }
  }

  async findAll() {
    return await this.prismaService.user.findMany();
  }

  async findByEmail(email: string) {
    return this.prismaService.user.findUnique({ where: { email } });
  }

  async findById(userId: string) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found!');

    return user;
  }

  async updateById(updateUserData: UpdateUserDto, userId: string) {
    await this.findById(userId);

    return await this.prismaService.user.update({
      data: updateUserData,
      where: { id: userId },
    });
  }

  async deleteById(userId: string) {
    await this.findById(userId);
    await this.prismaService.user.delete({ where: { id: userId } });
  }
}
