import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { ConfigService } from '../../shared/services/config.service'
import { User } from '../user/user.entity'
import { UserService } from '../user/user.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        public readonly configService: ConfigService,
        public readonly userService: UserService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get('JWT_SECRET_KEY'),
        })
    }

    async validate({ iat, exp, id: userId }): Promise<User> {
        const timeDiff = exp - iat
        if (timeDiff <= 0) {
            throw new UnauthorizedException()
        }
        const user = await this.userService.findById(userId)

        if (!user) {
            throw new UnauthorizedException()
        }
        return user
    }
}
