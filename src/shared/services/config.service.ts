import * as dotenv from 'dotenv'

import { IAwsConfig } from '../../interfaces/IAwsConfig'
import { NodeMailerConfig } from '../../interfaces/node-mailer-config.interface'

export class ConfigService {
    constructor() {
        const nodeEnv = this.nodeEnv
        dotenv.config({
            path: `.${nodeEnv}.env`,
        })

        // Replace \\n with \n to support multiline strings in AWS
        for (const envName of Object.keys(process.env)) {
            process.env[envName] = process.env[envName].replace(/\\n/g, '\n')
        }

        console.info(process.env)
    }

    public get(key: string): string {
        return process.env[key]
    }

    public getNumber(key: string): number {
        return Number(this.get(key))
    }

    get nodeEnv(): string {
        return this.get('NODE_ENV') || 'dev'
    }

    get nodeMailerConfig(): NodeMailerConfig {
        return {
            host: this.get('MAIL_HOST'),
            port: this.getNumber('MAIL_PORT'),
            secure: JSON.parse(this.get('MAIL_SECURE')), // make boolean
            auth: {
                user: this.get('MAIL_USER'),
                pass: this.get('MAIL_PASSWORD'),
            },
        }
    }

    get mongodbConfig(): string {
        return this.get('MONGODB_URI')
    }

    get awsS3Config(): IAwsConfig {
        return {
            accessKeyId: this.get('AWS_S3_ACCESS_KEY_ID'),
            secretAccessKey: this.get('AWS_S3_SECRET_ACCESS_KEY'),
            bucketName: this.get('S3_BUCKET_NAME'),
        }
    }
}
