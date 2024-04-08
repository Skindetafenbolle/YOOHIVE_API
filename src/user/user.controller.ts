import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/registry')
  @UsePipes(new ValidationPipe())
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('/prekol')
  async login(@Body() loginData: { emailOrPhone: string; password: string }) {
    const { emailOrPhone, password } = loginData;
    return this.userService.login(emailOrPhone, password);
  }
}
