import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from './users.service';
import { Response, Request } from 'express';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite:
    process.env.NODE_ENV === 'production'
      ? ('none' as 'none')
      : ('strict' as 'strict'),
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto): Promise<string> {
    return this.usersService.signup(createUserDto);
  }

  @Post('signin')
  async signin(
    @Body() loginUserDto: LoginUserDto,
    @Res() res: Response,
  ): Promise<void> {
    const { user, accessToken, refreshToken } =
      await this.usersService.signin(loginUserDto);
    res.cookie('token', accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      data: {
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  }

  @Post('refresh-token')
  async refreshToken(@Req() req: Request, @Res() res: Response): Promise<void> {
    const { refreshToken } = req.cookies;
    const { accessToken, refreshToken: newRefreshToken } =
      await this.usersService.refreshToken(refreshToken);
    res.cookie('token', accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie('refreshToken', newRefreshToken, {
      ...cookieOptions,
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      message: 'Tokens refreshed successfully',
    });
  }

  @Post('logout')
  async logout(@Res() res: Response): Promise<void> {
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    res.status(200).json({
      message: 'Logged out successfully',
    });
  }
}
