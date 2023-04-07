import { Response } from "express";

// types
import { IRequest } from "../types/IRequest.js";

// service
import messageService from "../services/MessageService.js";

// utils
import extractFields from "../utils/extractFields.js";

export type CreateMessageData = {
	author: string;
	message: string;
	dialogueId: string;
};

export default class MessageController {
	public async createMessage(req: IRequest, res: Response) {
		try {
			const io = req.app.get("io");

			const data = extractFields(req.body, ["message", "dialogueId"], true) as CreateMessageData;
			data.author = req.user ? req.user?._id : "";

			const { message, dialogue } = await messageService.create(data);

			io.emit("SERVER:MESSAGE_CREATED", await message);
			io.emit("SERVER:DIALOGUE_MESSAGE_UPDATE", dialogue, await message);

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

	public async getMessagesByDialogueId(req: IRequest, res: Response) {
		try {
			const dialogueId: string = req.params.id;

			const messages = await messageService.getMessages(dialogueId);

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

	public async removeMessageById(req: IRequest, res: Response) {
		try {
			const messageId: string = req.params.id;
			const author = req.user ? req.user?._id : "";

			await messageService.removeMessage(messageId, author);

			return res.status(200).json({
				status: "success",
				message: "Ваше сообщение было успешно удалено",
			});
		} catch (error: any) {
			return res.status(400).json({
				status: "error",
				message: error.message,
			});
		}
	}
}
