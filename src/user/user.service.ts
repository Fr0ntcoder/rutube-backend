import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionEntity } from './subscription.entity';
import { UserDto } from './user.dto';
import { UserEntity } from './user.entity';
import { genSalt, hash } from 'bcryptjs';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		@InjectRepository(SubscriptionEntity)
		private readonly subscriptionRepository: Repository<SubscriptionEntity>,
	) {}
	async byId(id: number) {
		const user = await this.userRepository.findOne({
			where: {
				id,
			},
			relations: {
				videos: true,
				subscriptions: {
					toChannel: true,
				},
			},
			order: {
				createdAt: 'DESC',
			},
		});

		if (!user) throw new NotFoundException('Юзер не найден!');

		return user;
	}
	async updateProfile(id: number, dto: UserDto) {
		const user = await this.byId(id);
		const isSameUser = await this.userRepository.findOneBy({
			email: dto.email,
		});
		if (isSameUser && id !== isSameUser.id)
			throw new BadRequestException('Email занят');

		if (dto.password) {
			const salt = await genSalt(10);
			user.password = await hash(dto.password, salt);
		}

		user.email = dto.email;
		user.name = dto.name;
		user.description = dto.description;
		user.avatarPath = dto.avatarPath;

		return this.userRepository.save(user);
	}

	async subscribe(id: number, channelId: number) {
		const data = {
			toChannel: { id: channelId },
			fromUser: { id },
		};

		const isSubscribed = await this.subscriptionRepository.findOneBy(data);

		if (!isSubscribed) {
			const newSubscription = await this.subscriptionRepository.create(data);
			await this.subscriptionRepository.save(newSubscription);
			return true;
		}

		await this.subscriptionRepository.delete(data);
		return false;
	}
	async getAll() {
		return this.userRepository.find();
	}
}
