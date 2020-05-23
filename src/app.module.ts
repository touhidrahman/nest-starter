import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { MailerModule } from '@nestjs-modules/mailer'
import { contextMiddleware } from './middlewares'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import { ConfigService } from './shared/services/config.service'
import { SharedModule } from './shared/shared.module'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'

@Module({
    imports: [
        MongooseModule.forRootAsync({
            imports: [SharedModule],
            useFactory: async (cs: ConfigService) => ({
                uri: cs.mongodbConfig,
            }),
            inject: [ConfigService],
        }),

        MailerModule.forRootAsync({
            imports: [SharedModule],
            useFactory: async (cs: ConfigService) => ({
                transport: cs.get('MAIL_TRANSPORT'),
                defaults: {
                    from: '"Website" <dept@website.com>',
                },
                template: {
                    dir: __dirname + '/templates',
                    adapter: new HandlebarsAdapter(),
                    options: { strict: true },
                },
            }),
            inject: [ConfigService],
        }),

        AuthModule,
        UserModule,
    ],
    exports: [MongooseModule],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
        consumer.apply(contextMiddleware).forRoutes('*')
    }
}
