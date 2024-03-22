import { IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(6, { message: 'Password then be more then 6 smbls' })
  password: string;

  phone: string;

  role: string;
}
