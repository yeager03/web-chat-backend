// model
import MessageModel from "../models/MessageModel.js";
import DialogueModel from "../models/DialogueModel.js";

// types
import { CreateMessageData } from "../controllers/MessageController.js";

// utils
import UserDto from "../utils/dtos/UserDto.js";

class MessageService {
	public async create(data: CreateMessageData) {
		const { author, message, dialogueId } = data;

		const dialogue = await DialogueModel.findById(dialogueId);

		if (!dialogue) {
			throw new Error(`Диалог с id:${dialogueId} не найден`);
		}

		if (!message) {
			throw new Error("Сообщение не может быть пустым");
		}

		const newMessage = new MessageModel({ author, message, dialogue: dialogueId });
		dialogue.lastMessage = newMessage._id;

		await dialogue.save();
		await newMessage.populate(["author", "dialogue"]);

		return newMessage.save();
	}

	public async getMessages(dialogueId: string) {
		const existDialogue = await DialogueModel.findById(dialogueId).lean();

		if (!existDialogue) {
			throw new Error(`Диалог с id:${dialogueId} не найден`);
		}

		const data = await MessageModel.find({ dialogue: dialogueId }).lean().populate(["dialogue", "author"]);

		const messages = data.map((message) => {
			return {
				...message,
				author: { ...new UserDto(message.author) },
			};
		});

		return messages;
	}

	public async removeMessage(messageId: string, author: string) {
		const message = await MessageModel.findById(messageId);

		if (!message) {
			throw new Error(`Сообщение с id:${messageId} не найдено`);
		}

		if (message.author.toString() !== author) {
			throw new Error(`Сообщение с id:${messageId} не принадлежит вам`);
		}

		const dialogue = await DialogueModel.findById(message.dialogue);

		if (!dialogue) {
			throw new Error("Диалог не найден");
		}

		const previousMessages = await MessageModel.find({ dialogue: message.dialogue }).sort({ createdAt: -1 });

		dialogue.lastMessage = previousMessages[1];

		await dialogue.save();

		return message.deleteOne();
	}
}

export default new MessageService();
