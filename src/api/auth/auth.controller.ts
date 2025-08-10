import {
  Controller,
  Post,
  Logger,
  Request,
  UseGuards,
  Get,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.gaurd';
import { LocalAuthGuard } from './local-auth.gaurd';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  logger: Logger;
  constructor(
    private readonly authService: AuthService,
  ) {
    this.logger = new Logger(AuthController.name);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Body() loginDto: LoginDto, @Request() req): Promise<any> {
    try {
      return await this.authService.loginUser(req.user);
      //return req.user;
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('viewProfile')
  async getUser(@Request() req): Promise<any> {
    return req.user;
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<any> {
    return this.authService.register(createUserDto);
  }

  @Post('refresh')
  async refresh(@Request() req): Promise<any> {
    // expects { refreshToken } in body
    const { refreshToken } = req.body;
    return this.authService.refreshAccessToken(refreshToken);
  }
}
