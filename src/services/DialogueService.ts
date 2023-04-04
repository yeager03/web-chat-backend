// model
import DialogueModel from "../models/DialogueModel.js";
import UserModel from "../models/UserModel.js";

// service
import MessageService from "./MessageService.js";

// utils
import UserDto from "../utils/dtos/UserDto.js";

// types
import { CreateDialogueData } from "./../controllers/DialogueController.js";

class DialogueService {
	public async create(data: CreateDialogueData) {
		const { authorId, interlocutorId, lastMessage } = data;

		if (authorId === interlocutorId) {
			throw new Error("Нельзя создать диалог самим собой");
		}

		const author = await UserModel.findOne({ _id: authorId });
		const interlocutor = await UserModel.findOne({ _id: interlocutorId });

		if (!author) {
			throw new Error("Автор не найден");
		}

		if (!interlocutor) {
			throw new Error("Собеседник не найден");
		}

		if (!author.friends.includes(interlocutorId) && !interlocutor.friends.includes(authorId)) {
			throw new Error("Вы не являетесь друзьями");
		}

		const dialogue = await DialogueModel.create({
			members: [authorId, interlocutorId],
		});

		const message = await MessageService.create({
			author: authorId,
			message: lastMessage,
			dialogueId: dialogue._id,
		});

		dialogue.lastMessage = message._id;

		await dialogue.save();

		return dialogue._id;
	}

	public async getDialogues(authorId: string) {
		const data = await DialogueModel.find({ members: authorId })
			.lean()
			.populate([
				{
					path: "members",
					select: "_id email fullName avatar avatarColors lastVisit isOnline",
				},
				{
					path: "lastMessage",
					populate: [
						{
							path: "author",
							model: "User",
							select: "_id email fullName avatar avatarColors lastVisit isOnline",
						},
					],
				},
			]);

		return data;
	}

	public async removeDialogue(authorId: string) {
		const dialogue = await DialogueModel.findOne({ author: authorId });

		if (!dialogue) {
			throw new Error("Диалог не найден");
		}

		return dialogue.deleteOne();
	}
}

export default new DialogueService();
