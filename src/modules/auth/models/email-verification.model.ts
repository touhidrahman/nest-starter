import { Document } from 'mongoose'
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose'

@Schema()
export class EmailVerification extends Document {
    @Prop() email: string
    @Prop() emailToken: string
    @Prop() timestamp: Date
}

export const EmailVerificationSchema = SchemaFactory.createForClass(EmailVerification)
