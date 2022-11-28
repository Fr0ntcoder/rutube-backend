import { Injectable } from '@nestjs/common';
import { path } from 'app-root-path';
import { writeFile, ensureDir } from 'fs-extra';
import { IMediaResponse } from './media.inteface';

@Injectable()
export class MediaService {
	async saveMedia(
		mediaFile: Express.Multer.File,
		folder = 'default',
	): Promise<IMediaResponse> {
		const uploadFolder = `${path}/uploads/${folder}`;
		await ensureDir(uploadFolder);

		await writeFile(
			`${uploadFolder}/${mediaFile.originalname}`,
			mediaFile.buffer,
		);

		return {
			url: `/uploads/${folder}/${mediaFile.originalname}`,
			name: mediaFile.originalname,
		};
	}
}
