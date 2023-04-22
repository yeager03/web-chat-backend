import { Response } from "express";

// types
import { IRequest } from "../types/IRequest.js";

// service
import messageService from "../services/MessageService.js";

// utils
import extractFields from "../utils/extractFields.js";

export type GetMessages = {
	dialogueId: string;
	userId: string;
};

export type IFile =
	| {
			[fieldname: string]: Express.Multer.File;
	  }
	| Express.Multer.File[]
	| undefined;

export type CreateMessage = {
	messageAuthor: string;
	messageText: string;
	dialogueId: string;
	files: IFile;
};

export type RemoveMessage = {
	authorId: string;
	messageId: string;
};

export type EditMessage = {
	authorId: string;
	messageId: string;
	messageText: string;
};

export default class MessageController {
	public async getMessages(req: IRequest, res: Response) {
		try {
			const io = req.app.get("io");

			const dialogueId: string = req.params.id;
			const userId: string = req.user ? req.user._id : "";

			const messages = await messageService.getMessages({ dialogueId, userId }, io);

			return res.status(200).json({
				status: "success",
				messages,
			});
		} catch (error: any) {
			return res.status(404).json({
				status: "error",
				message: error.message,
			});
		}
	}

	public async createMessage(req: IRequest, res: Response) {
		try {
			const io = req.app.get("io");

			const data = extractFields(req.body, ["messageText", "dialogueId"], true) as CreateMessage;
			data.messageAuthor = req.user ? req.user?._id : "";
			data.files = req.files?.length ? (req.files as IFile) : [];

			await messageService.create(data, io);

			return res.status(200).json({
				status: "success",
				message: "Сообщение было успешно добавлено",
			});
		} catch (error: any) {
			return res.status(400).json({
				status: "error",
				message: error.message,
			});
		}
	}

	public async removeMessage(req: IRequest, res: Response) {
		try {
			const io = req.app.get("io");

			const authorId: string = req.user ? req.user?._id : "";
			const messageId: string = req.params.id;

			await messageService.removeMessage({ authorId, messageId }, io);

			return res.status(200).json({
				status: "success",
				message: "Ваше сообщение было успешно удалено",
			});
		} catch (error: any) {
			return res.status(405).json({
				status: "error",
				message: error.message,
			});
		}
	}

	public async editMessage(req: IRequest, res: Response) {
		try {
			const io = req.app.get("io");

			const authorId: string = req.user ? req.user?._id : "";
			const messageId: string = req.params.id;
			const messageText: string = req.body.message.trim();

			await messageService.editMessage({ authorId, messageId, messageText }, io);

			return res.status(200).json({
				status: "success",
				message: "Ваше сообщение было успешно изменено",
			});
		} catch (error: any) {
			return res.status(405).json({
				status: "error",
				message: error.message,
			});
		}
	}
}
