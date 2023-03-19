// model
import DialogueModel from "../models/DialogueModel.js";

// service
import MessageService from "./MessageService.js";
import UserService from "./UserService.js";

// utils
import UserDto from "../utils/dtos/UserDto.js";

// types
import { CreateDialogueData } from "./../controllers/DialogueController.js";

class DialogueService {
	public async create(data: CreateDialogueData) {
		const { author, interlocutor, lastMessage } = data;

		if (author === interlocutor) {
			throw new Error("Нельзя создать диалог самим собой");
		}

		const candidate = await UserService.getUserById(interlocutor);

		if (!candidate) {
			throw new Error("Собеседник не найден");
		}

		const dialogue = await DialogueModel.create({
			author,
			interlocutor,
		});

		const message = await MessageService.create({
			author,
			message: lastMessage,
			dialogueId: dialogue._id,
		});

		dialogue.lastMessage = message._id;

		await dialogue.save();
		return dialogue;
	}

	public async getDialogues(authorId: string) {
		const data = await DialogueModel.find()
			.or([{ author: authorId }, { interlocutor: authorId }])
			.lean()
			.populate([
				"author",
				"interlocutor",
				{
					path: "lastMessage",
					populate: [
						{
							path: "author",
							model: "User",
						},
					],
				},
			]);

		const dialogues = data.map((dialogue) => {
			return {
				...dialogue,
				author: { ...new UserDto(dialogue.author) },
				interlocutor: { ...new UserDto(dialogue.interlocutor) },
				lastMessage: {
					...dialogue.lastMessage,
					author: { ...new UserDto(dialogue.lastMessage.author) },
				},
			};
		});

		return dialogues;
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
