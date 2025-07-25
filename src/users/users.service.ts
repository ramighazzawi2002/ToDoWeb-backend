import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../schema/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async signup(createUserDto: CreateUserDto): Promise<string> {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
      isDeleted: false,
    });
    if (existingUser) {
      throw new ConflictException(
        'User with this email already exists. Please use a different email.',
      );
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    await user.save();
    return 'User created successfully';
  }

  async signin(loginUserDto: LoginUserDto) {
    const user = await this.userModel.findOne({
      email: loginUserDto.email,
      isDeleted: false,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload = { email: user.email, id: user._id };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '1y' });
    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
  }

  async refreshToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('No refresh token provided');
    }
    try {
      const payload = this.jwtService.verify(token);
      if (!payload) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const accessToken = this.jwtService.sign({
        email: payload.email,
        id: payload.id,
      });
      const refreshToken = this.jwtService.sign(
        {
          email: payload.email,
          id: payload.id,
        },
        { expiresIn: '1y' },
      );
      return { accessToken, refreshToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(): Promise<string> {
    return 'User logged out successfully';
  }
}
