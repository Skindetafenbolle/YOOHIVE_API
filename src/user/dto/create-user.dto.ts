import { IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @IsEmail()
  @ApiProperty()
  email: string;

  @MinLength(6, { message: 'Password then be more then 6 smbls' })
  @ApiProperty()
  password: string;

  @ApiProperty()
  phone: string;

  role: string;
}
