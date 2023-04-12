// model
import MessageModel from "../models/MessageModel.js";
import DialogueModel from "../models/DialogueModel.js";

// types
import { CreateMessageData } from "../controllers/MessageController.js";

// utils
import UserDto from "../utils/dtos/UserDto.js";

// crypto
import crypto from "crypto-js";

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

		const newMessage = new MessageModel({
			author,
			message: crypto.AES.encrypt(message, process.env.CRYPTO_KEY || "").toString(),
			dialogue: dialogueId,
		});
		dialogue.lastMessage = newMessage._id;

		await dialogue.save();
		await newMessage.populate([
			{
				path: "author",
				select: "_id email fullName avatar avatarColors lastVisit isOnline",
			},
		]);

		return {
			message: await newMessage.save(),
			dialogueId,
		};
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

	public async removeMessage(messageId: string, authorId: string) {
		const message = await MessageModel.findById(messageId);

		if (!message) {
			throw new Error(`Сообщение не найдено`);
		}

		if (message.author.toString() !== authorId) {
			throw new Error(`Вы не являетесь автором данного сообщения`);
		}

		const dialogue = await DialogueModel.findById(message.dialogue);

		if (!dialogue) {
			throw new Error("Диалог не найден");
		}

		const previousMessage = await MessageModel.findOne({ _id: { $lt: messageId }, dialogue }).sort({
			_id: -1,
		});
		const lastMessageId = dialogue.lastMessage.toString();

		if (lastMessageId === messageId) {
			dialogue.lastMessage = previousMessage;
		}

		if (!previousMessage) {
			await dialogue.deleteOne();
			await message.deleteOne();

			return { dialogueId: message.dialogue, message, previousMessage };
		}

		await previousMessage.populate([
			{
				path: "author",
				select: "_id email fullName avatar avatarColors lastVisit isOnline",
			},
		]);

		await dialogue.save();
		await message.deleteOne();

		return { dialogueId: message.dialogue, message, previousMessage };
	}
}

export default new MessageService();
