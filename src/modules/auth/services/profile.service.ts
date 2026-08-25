import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auth } from '../entities/auth.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
  ) {}

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<Auth> {
    const auth = await this.authRepository.findOne({
      where: { id: userId },
    });

    if (!auth) {
      throw new NotFoundException('User not found');
    }

    Object.assign(auth, updateProfileDto);

    return await this.authRepository.save(auth);
  }

  async getProfile(userId: string): Promise<Auth> {
    const auth = await this.authRepository.findOne({
      where: { id: userId },
    });

    if (!auth) {
      throw new NotFoundException('User not found');
    }

    return auth;
  }
}
