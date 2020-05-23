import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
    UseInterceptors,
    Param,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'

import { AuthUser } from '../../decorators/auth-user.decorator'
import { AuthGuard } from '../../guards/auth.guard'
import { AuthUserInterceptor } from '../../interceptors/auth-user-interceptor.service'
import { UserDto } from '../user/dto/user.dto'
import { User } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { AuthService } from './auth.service'
import { LoginPayloadDto } from './dto/login-payload.dto'
import { UserLoginDto } from './dto/user-login.dto'
import { UserRegisterDto } from './dto/user-register.dto'
import { UserNotFoundException } from '../../exceptions/user-not-found.exception'

@Controller('auth')
@ApiTags('auth')
export class AuthController {
    constructor(
        public readonly userService: UserService,
        public readonly authService: AuthService,
    ) {}

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: LoginPayloadDto,
        description: 'User info with access token',
    })
    async login(@Body() userLoginDto: UserLoginDto): Promise<LoginPayloadDto> {
        const user = await this.authService.validateLogin(userLoginDto)
        const userDto = new UserDto(user)
        const token = await this.authService.createToken(user)
        return new LoginPayloadDto(userDto, token)
    }

    @Post('signup')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ type: UserDto, description: 'Successfully Registered' })
    async signup(@Body() dto: UserRegisterDto): Promise<UserDto> {
        if (dto.password !== dto.passwordConfirm) {
            throw new BadRequestException('Passwords do not match')
        }
        const createdUser = await this.userService.createUser(dto)

        return new UserDto(createdUser)
    }

    @Get('me')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard)
    @UseInterceptors(AuthUserInterceptor)
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserDto, description: 'current user info' })
    getCurrentUser(@AuthUser() user: User): UserDto {
        return new UserDto(user)
    }

    @Get('email/verify/:token')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ type: 'boolean', description: 'Verify user email' })
    async verifyEmail(@Param('token') token: string): Promise<boolean> {
        try {
            return this.authService.verifyEmail(token)
        } catch (error) {
            throw new UserNotFoundException('Token is invalid')
        }
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ type: 'boolean', description: 'Verify user email' })
    async sendPasswordForgotEmail(@Body('email') email: string): Promise<{ message: string }> {
        try {
            this.authService.sendForgotPasswordEmail(email)
            return { message: 'Email sent' }
        } catch (error) {
            throw new UserNotFoundException('Token is invalid')
        }
    }
}
