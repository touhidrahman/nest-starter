import { forwardRef, Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'

import { UserModule } from '../user/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'
import { MongooseModule } from '@nestjs/mongoose'
import { EmailVerification, EmailVerificationSchema } from './models/email-verification.model'
import { ConsentRegistrySchema } from './schemas/consent-registry.schema'
import { ForgottenPasswordSchema } from './schemas/forgotten-password.schema'

@Module({
    imports: [
        forwardRef(() => UserModule),
        MongooseModule.forFeature([
            {
                name: EmailVerification.name,
                schema: EmailVerificationSchema,
            },
            {
                name: 'ConsentRegistry',
                schema: ConsentRegistrySchema,
            },
            {
                name: 'ForgottenPassword',
                schema: ForgottenPasswordSchema,
            },
        ]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [PassportModule.register({ defaultStrategy: 'jwt' }), AuthService],
})
export class AuthModule {}
