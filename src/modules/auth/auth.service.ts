import {
    Injectable,
    InternalServerErrorException,
    HttpService,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserNotFoundException } from '../../exceptions/user-not-found.exception'
import { JwtPayload } from './jwt-payload.interface'
import { ContextService } from '../../providers/context.service'
import { UtilsService } from '../../providers/utils.service'
import { ConfigService } from '../../shared/services/config.service'
import { User } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { TokenPayloadDto } from './dto/token-payload.dto'
import { UserLoginDto } from './dto/user-login.dto'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { EmailVerification } from './models/email-verification.model'
import { ConsentRegistry } from './models/consent-registry.model'
import { ForgottenPassword } from './models/forgotten-password.model'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class AuthService {
    private static _authUserKey = 'user_key'

    constructor(
        private readonly jwtService: JwtService,
        private readonly mailer: MailerService,
        private readonly configService: ConfigService,
        private readonly userService: UserService,
        @InjectModel(EmailVerification.name)
        private readonly emailVerificationModel: Model<EmailVerification>,
        @InjectModel('ConsentRegistry')
        private readonly consentModel: Model<ConsentRegistry>,
        @InjectModel('ForgottenPassword')
        private readonly forgotPasswordModel: Model<ForgottenPassword>,
    ) {}

    async createToken(user: User): Promise<TokenPayloadDto> {
        const payload: JwtPayload = {
            sub: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        }
        return new TokenPayloadDto({
            expiresIn: this.configService.getNumber('JWT_EXPIRATION_TIME'),
            accessToken: await this.jwtService.signAsync(payload),
        })
    }

    async validateLogin(userLoginDto: UserLoginDto): Promise<User> {
        const user = await this.userService.findOne({
            email: userLoginDto.email,
        })
        const isPasswordValid = await UtilsService.validateHash(
            userLoginDto.password,
            user && user.passwordHash,
        )
        if (!user || !isPasswordValid) {
            throw new UserNotFoundException()
        }
        return user
    }

    async createEmailToken(email: string): Promise<boolean> {
        const record = await this.emailVerificationModel.findOne({ email })
        const within15Min = (new Date().getTime() - record.timestamp.getTime()) / 60000 < 15
        if (record && within15Min) {
            throw new InternalServerErrorException(
                'Email sent recently. Wait for 15 mins to request a new one.',
            )
        }

        const randomNumber = Math.floor(Math.random() * 9000000) + 1000000 // 7 digit
        const saved = await this.emailVerificationModel.findOneAndUpdate(
            { email },
            {
                email,
                emailToken: randomNumber.toString(),
                timestamp: new Date(),
            },
            { upsert: true },
        )

        if (saved) {
            return true
        } else {
            throw new InternalServerErrorException('Error creating reset password request')
        }
    }

    // TODO: future
    async saveUserConsent(email: string): Promise<ConsentRegistry> {
        try {
            const http = new HttpService()

            const consent = new this.consentModel()
            consent.email = email
            consent.date = new Date()
            consent.registrationForm = ['name', 'surname', 'email', 'birthday date', 'password']
            consent.checkboxText = 'I accept privacy policy'
            const privacyPolicyResponse: any = await http
                .get('https://www.XXXXXX.com/api/privacy-policy')
                .toPromise()
            consent.privacyPolicy = privacyPolicyResponse.data.content
            const cookiePolicyResponse: any = await http
                .get('https://www.XXXXXX.com/api/privacy-policy')
                .toPromise()
            consent.cookiePolicy = cookiePolicyResponse.data.content
            consent.acceptedPolicy = 'Y'
            return await consent.save()
        } catch (error) {
            console.error(error)
        }
    }

    async createForgottenPasswordToken(email: string): Promise<ForgottenPassword> {
        const record = await this.forgotPasswordModel.findOne({ email })
        const within15Min = (new Date().getTime() - record.timestamp.getTime()) / 60000 < 15
        if (record && within15Min) {
            throw new InternalServerErrorException(
                'Email to reset password was sent recently. Wait for 15 mins to request a new one.',
            )
        }

        const randomNumber = Math.floor(Math.random() * 9000000) + 1000000 // 7 digit
        const saved = await this.forgotPasswordModel.findOneAndUpdate(
            { email },
            {
                email,
                newPasswordToken: randomNumber.toString(),
                timestamp: new Date(),
            },
            { upsert: true, new: true },
        )

        if (saved) {
            return saved
        } else {
            throw new InternalServerErrorException('Error creating reset password request')
        }
    }

    async verifyEmail(token: string): Promise<boolean> {
        const record = await this.emailVerificationModel.findOne({ emailToken: token })
        if (record && record.email) {
            const user = await this.userService.findOne({ email: record.email })

            user.verified = true
            const verifiedUser = await user.save()
            return !!verifiedUser
        } else {
            throw new ForbiddenException('Code not valid')
        }
    }

    async getForgottenPasswordModel(newPasswordToken: string): Promise<ForgottenPassword> {
        return this.forgotPasswordModel.findOne({ newPasswordToken })
    }

    async sendVerificationEmail(email: string): Promise<void> {
        const record = await this.emailVerificationModel.findOne({ email })

        const config = this.configService
        if (record && record.emailToken) {
            this.mailer
                .sendMail({
                    to: email, // list of emails separated by ,
                    subject: 'Forgotten Password',
                    text: 'Forgotten Password',
                    html: [
                        'Hi there! Please ',
                        `<a href="http://${config.get('HOST')}:${config.get(
                            'PORT',
                        )}/auth/email/verify/${record.emailToken}">`,
                        'click here',
                        '</a> to verify your email.',
                    ].join(' '),
                })
                .then((info) => {
                    console.info('Mail sent: %s', info.messageId)
                })
                .catch((error) => {
                    console.error('Mail not sent: %s', error)
                })
        }
    }

    async sendForgotPasswordEmail(email: string): Promise<void> {
        const user = await this.userService.findOne({ email })
        if (!user) {
            throw new NotFoundException('User not found')
        }

        const tokenModel = await this.createForgottenPasswordToken(email)

        const config = this.configService
        if (tokenModel && tokenModel.newPasswordToken) {
            this.mailer
                .sendMail({
                    to: email, // list of emails separated by ,
                    subject: 'Forgotten Password',
                    text: 'Forgotten Password',
                    html: [
                        'Hi there! Please click the following link to reset your password',
                        `<a href="http://${config.get('HOST')}:${config.get(
                            'PORT',
                        )}/auth/email/reset-password/${tokenModel.newPasswordToken}">`,
                        'Reset Password Link',
                        '</a>',
                    ].join(' '),
                })
                .then((info) => {
                    console.info('Mail sent: %s', info.messageId)
                })
                .catch((error) => {
                    console.error('Mail not sent: %s', error)
                })
        }
    }

    static setAuthUser(user: User): void {
        ContextService.set(AuthService._authUserKey, user)
    }

    static getAuthUser(): User {
        return ContextService.get(AuthService._authUserKey)
    }
}
