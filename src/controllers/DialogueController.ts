import { Response } from "express";

// service
import dialogueService from "../services/DialogueService.js";

// types
import { IRequest } from "../types/IRequest.js";

// utils
import extractFields from "../utils/extractFields.js";

export type CreateDialogueData = {
	author: string;
	interlocutor: string;
	lastMessage: string;
};

export default class DialogueController {
	public async createDialogue(req: IRequest, res: Response) {
		try {
			const io = req.app.get("io");
			const data = extractFields(req.body, ["interlocutor", "lastMessage"], true) as CreateDialogueData;
			data.author = req.user ? req.user?._id : "";

			const dialogue = await dialogueService.create(data);
			io.emit("SERVER:DIALOGUE_CREATED");
			return res.status(200).send({ status: "success", dialogue });
		} catch (error: any) {
			return res.status(400).json({
				status: "error",
				message: error.message,
			});
		}
	}

	public async getDialogues(req: IRequest, res: Response) {
		try {
			const authorId: string = req.user ? req.user._id : "";

			const dialogues = await dialogueService.getDialogues(authorId);

			return res.status(200).send({ status: "success", dialogues });
		} catch (error: any) {
			return res.status(400).json({
				status: "error",
				message: error.message,
			});
		}
	}

	public async removeDialogueByAuthorId(req: IRequest, res: Response) {
		try {
			const authorId: string = req.params.id; // req.user?._id

			await dialogueService.removeDialogue(authorId);

			return res.status(200).json({
				status: "success",
				message: "Диалог был успешно удален",
			});
		} catch (error: any) {
			return res.status(400).json({
				status: "error",
				message: error.message,
			});
		}
	}
}
