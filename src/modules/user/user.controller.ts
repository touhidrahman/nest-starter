import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Query,
    UseGuards,
    UseInterceptors,
    ValidationPipe,
} from '@nestjs/common'
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'

import { RoleType } from '../../common/constants/role-type'
import { AuthUser } from '../../decorators/auth-user.decorator'
import { Roles } from '../../decorators/roles.decorator'
import { AuthGuard } from '../../guards/auth.guard'
import { RolesGuard } from '../../guards/roles.guard'
import { AuthUserInterceptor } from '../../interceptors/auth-user-interceptor.service'
import { UsersPageDto } from './dto/users-page.dto'
import { UsersPageOptionsDto } from './dto/users-page-options.dto'
import { User } from './user.entity'
import { UserService } from './user.service'

@Controller('users')
@ApiTags('users')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(AuthUserInterceptor)
@ApiBearerAuth()
export class UserController {
    constructor(private userService: UserService) {}

    @Get('admin')
    @Roles(RoleType.USER)
    @HttpCode(HttpStatus.OK)
    async admin(@AuthUser() user: User) {
        return 'only for you admin: ' + user.name
    }

    @Get('users')
    @Roles(RoleType.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Get users list',
        type: UsersPageDto,
    })
    getUsers(
        @Query(new ValidationPipe({ transform: true }))
        pageOptionsDto: UsersPageOptionsDto,
    ): Promise<User[]> {
        // ): Promise<UsersPageDto> { // TODO
        return this.userService.find(pageOptionsDto)
    }
}
