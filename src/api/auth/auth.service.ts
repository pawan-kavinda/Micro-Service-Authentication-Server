import {
  Injectable,
  forwardRef,
  Inject,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private UserService: UserService,
    private jwtService: JwtService
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const query = { email: email };
    const user = await this.UserService.findOne(query);
    if (!user) throw new NotFoundException('Email Does not exist');
    const isMatched = await this.comparePasswords(pass, user.password);
    if (!isMatched) throw new UnauthorizedException('Invalid Password');
    return user;
  }

  async generateJwtToken(user: any) {
    const payload = {
      email: user.email
    };
    return this.jwtService.sign(payload);
  }

  async loginUser (user: any){
    console.log("🚀 ~ AuthService ~ loginUser ~ user:", user)
    const accessToken = await this.generateJwtToken(user);
    await this.UserService.findOneAndUpdate(
      { email: user.email },
      { accessToken } 
    )
    return {access_token: accessToken, user};
  }

  async getHashedPassword(password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          reject(err);
        }
        resolve(hash);
      });
    });
  }

  async comparePasswords(
    password: string,
    hashedPassword: string
  ): Promise<any> {
    return bcrypt
      .compare(password, hashedPassword)
      .then((isMatch) => {
        if (isMatch) return true;
        return false;
      })
      .catch((err) => err);
  }

  // Register a new user
  async register(newUser: CreateUserDto): Promise<any> {
    console.log("🚀 ~ AuthService ~ register ~ newUser:", newUser)
    const query = { email: newUser.email };
    const isUser = await this.UserService.findOne(query);
    if (isUser) throw { status: 409, message: 'User Already Exist' };
    const user = await this.UserService.create(newUser);
    return { message: 'Registration successful', user };
  }

   
  async refreshAccessToken(refreshToken: string): Promise<any> {
     
    try {
      const payload = this.jwtService.verify(refreshToken, { secret: 'JWT_SECRET' });
       
      const user = await this.UserService.findOne({ email: payload.email });
      if (!user) throw new UnauthorizedException('Invalid refresh token');
      return {
        access_token: this.jwtService.sign({ email: user.email }),
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
