// fs
import fs from "fs";

// path
import path from "path";

// model
import FileModel, { IFile } from "../models/FileModel.js";

class FileService {
	public async createFile(files: any, author: string, fileDirName: string, message: string | null = null) {
		const uploadedFilesId: IFile[] = [];

		for (let key in files) {
			const file = files[key];

			const fileName = file.originalname;
			const filePath = file.path;
			const size = file.size;
			const url = `${process.env.API_URL}/uploads/${fileDirName}/${file.filename}`;
			const extension = file.mimetype.split("/")[1];

			const uploadedFile = new FileModel({
				fileName,
				filePath,
				size,
				url,
				extension,
				author,
				message,
			});

			await uploadedFile.save();
			uploadedFilesId.push(uploadedFile._id);
		}

		return uploadedFilesId;
	}

	public async removeFile(author: string, message: string | null = null) {
		const files = await FileModel.find({ author, message }).lean().select("filePath");

		files.forEach((file) => {
			fs.unlink(path.resolve(file.filePath), (err) => console.log(err));
		});

		await FileModel.deleteMany({ message, author });
	}
}

export default new FileService();
