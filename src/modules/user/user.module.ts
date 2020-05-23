import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { SharedModule } from '../../shared/shared.module'
import { AuthModule } from '../auth/auth.module'
import { UserController } from './user.controller'
import { UserSchema } from './user.schema'
import { UserService } from './user.service'

@Module({
    imports: [
        forwardRef(() => AuthModule),
        forwardRef(() => SharedModule),
        MongooseModule.forFeature([
            {
                name: 'User',
                schema: UserSchema,
            },
        ]),
    ],
    controllers: [UserController],
    exports: [UserService, MongooseModule],
    providers: [UserService],
})
export class UserModule {}
