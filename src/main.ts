import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common'
import { NestFactory, Reflector } from '@nestjs/core'
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express'
import * as compression from 'compression'
import * as RateLimit from 'express-rate-limit'
import * as helmet from 'helmet'
import * as mongoose from 'mongoose'
import * as morgan from 'morgan'

import { AppModule } from './app.module'
import { HttpExceptionFilter } from './filters/bad-request.filter'
import { ConfigService } from './shared/services/config.service'
import { SharedModule } from './shared/shared.module'
import { setupSwagger } from './viveo-swagger'

mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)
mongoose.set('useNewUrlParser', true)
mongoose.set('useUnifiedTopology', true)

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(), {
        cors: true,
    })
    app.enable('trust proxy') // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
    app.use(helmet())
    app.use(
        new RateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
        }),
    )
    app.use(compression())
    app.use(morgan('combined'))

    const reflector = app.get(Reflector)

    app.useGlobalFilters(new HttpExceptionFilter(reflector))

    app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector))

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            // dismissDefaultMessages: true,
            validationError: {
                target: false,
            },
        }),
    )

    const configService = app.select(SharedModule).get(ConfigService)

    if (['dev', 'staging'].includes(configService.nodeEnv)) {
        setupSwagger(app)
    }

    const port = configService.getNumber('PORT')
    await app.listen(port)

    console.info(`server running on port ${port}`)
}

bootstrap()
