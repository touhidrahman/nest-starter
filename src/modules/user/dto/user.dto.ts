import { ApiPropertyOptional } from '@nestjs/swagger'

import { RoleType } from '../../../common/constants/role-type'
import { User } from '../user.entity'

export class UserDto {
    _id?: string

    @ApiPropertyOptional()
    name: string

    @ApiPropertyOptional({ enum: RoleType })
    role: RoleType

    @ApiPropertyOptional()
    email: string

    @ApiPropertyOptional()
    imageUrl: string

    constructor(user: User) {
        this._id = user.id
        this.name = user.name
        this.role = user.role
        this.email = user.email
        this.imageUrl = user.imageUrl
    }
}
