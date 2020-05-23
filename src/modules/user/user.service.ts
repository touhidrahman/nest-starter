import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import * as bcrypt from 'bcrypt'
import { Model } from 'mongoose'

import { RoleType } from '../../common/constants/role-type'
import { AwsS3Service } from '../../shared/services/aws-s3.service'
import { ValidatorService } from '../../shared/services/validator.service'
import { UserRegisterDto } from '../auth/dto/user-register.dto'
import { UsersPageOptionsDto } from './dto/users-page-options.dto'
import { User } from './user.entity'

@Injectable()
export class UserService {
    constructor(
        @InjectModel('User') private readonly userModel: Model<User>,
        public readonly validatorService: ValidatorService,
        public readonly awsS3Service: AwsS3Service,
    ) {}

    async find(options: UsersPageOptionsDto): Promise<User[]> {
        return this.userModel.find().limit(options.take).skip(options.skip).exec()
    }

    async findOne(query: { [k: string]: string }): Promise<User> {
        return this.userModel.findOne(query).exec()
    }

    async findById(id: string): Promise<User> {
        return this.userModel.findById(id).exec()
    }

    async createUser(dto: UserRegisterDto): Promise<User> {
        const salt = await bcrypt.genSalt()
        const hash = await this.hashPassword(dto.password, salt)
        const user = { ...dto, roles: [RoleType.USER], salt, passwordHash: hash }
        return this.userModel.create(user)
    }

    private async hashPassword(password: string, salt: string): Promise<string> {
        return bcrypt.hash(password, salt)
    }
}
