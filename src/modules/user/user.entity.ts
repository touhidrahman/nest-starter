import { Document } from 'mongoose'

import { RoleType } from '../../common/constants/role-type'

export class User extends Document {
    role: RoleType
    email: string
    passwordHash: string
    name: string
    salt: string
    imageUrl?: string
    verified?: boolean
    isActive: boolean
    disabledStatus: {
        banned?: boolean
        deleted?: boolean
        frozen?: boolean
    }
    createdAt: Date
    updatedAt: Date
}
