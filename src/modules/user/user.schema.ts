import { Schema } from 'mongoose'

export const UserSchema = new Schema({
    email: { type: String, unique: true },
    passwordHash: String,
    name: String,
    roles: Array,
    salt: String,
    imageUrl: String,
    verified: Boolean,
    isActive: Boolean,
    disabledStatus: {
        banned: Boolean,
        deleted: Boolean,
        frozen: Boolean,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
})
