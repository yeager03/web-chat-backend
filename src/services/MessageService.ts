// model
import MessageModel from "../models/MessageModel.js";
import DialogueModel from "../models/DialogueModel.js";

// types
import { Server as SocketServer } from "socket.io";
import { CreateMessage, EditMessage, RemoveMessage } from "../controllers/MessageController.js";

// crypto
import crypto from "crypto-js";

class MessageService {
	public async getMessages(dialogueId: string) {
		const existDialogue = await DialogueModel.findById(dialogueId).lean();

		if (!existDialogue) {
			throw new Error(`Диалог с id:${dialogueId} не найден`);
		}

		const messages = await MessageModel.find({ dialogue: dialogueId })
			.lean()
			.populate([
				"dialogue",
				{
					path: "author",
					select: "_id email fullName avatar avatarColors lastVisit isOnline",
				},
			]);

		return messages;
	}

	public async create(data: CreateMessage, io: SocketServer | null = null) {
		const { messageAuthor, messageText, dialogueId } = data;

		const dialogue = await DialogueModel.findById(dialogueId);

		if (!dialogue) {
			throw new Error(`Диалог с id:${dialogueId} не найден`);
		}

		if (!messageText) {
			throw new Error("Сообщение не может быть пустым");
		}

		const message = new MessageModel({
			author: messageAuthor,
			message: crypto.AES.encrypt(messageText, process.env.CRYPTO_KEY || "").toString(),
			dialogue: dialogueId,
		});
		dialogue.lastMessage = message._id;

		await dialogue.populate("members", "socket_id");
		await dialogue.save();

		await message.populate("author", "_id email fullName avatar avatarColors lastVisit isOnline");
		await message.save();

		if (io) {
			dialogue.members.forEach((user) => {
				io.to(user.socket_id).emit("SERVER:MESSAGE_CREATED", message);
				io.to(user.socket_id).emit("SERVER:DIALOGUE_MESSAGE_UPDATE", dialogueId, message);
			});
		}

		return message;
	}

	public async removeMessage(data: RemoveMessage, io: SocketServer) {
		const { authorId, messageId } = data;

		const message = await MessageModel.findById(messageId);

		if (!message) {
			throw new Error("Сообщение не найдено");
		}

		if (message.author.toString() !== authorId) {
			throw new Error("Вы не являетесь автором данного сообщения");
		}

		const dialogue = await DialogueModel.findById(message.dialogue);

		if (!dialogue) {
			throw new Error("Диалог не найден");
		}

		await dialogue.populate("members", "socket_id");

		const previousMessage = await MessageModel.findOne({ _id: { $lt: messageId }, dialogue }).sort({
			_id: -1,
		});
		const lastMessageId = dialogue.lastMessage.toString();

		if (lastMessageId === messageId) {
			dialogue.lastMessage = previousMessage;
		}

		if (!previousMessage) {
			await message.deleteOne();
			await dialogue.deleteOne();

			return dialogue.members.forEach((user) => {
				io.to(user.socket_id).emit("SERVER:MESSAGE_DELETED", message);
				io.to(user.socket_id).emit("SERVER:DIALOGUE_MESSAGE_UPDATE", dialogue._id, previousMessage);
			});
		}

		await previousMessage.populate("author", "_id email fullName avatar avatarColors lastVisit isOnline");

		await dialogue.save();
		await message.deleteOne();

		return dialogue.members.forEach((user) => {
			io.to(user.socket_id).emit("SERVER:MESSAGE_DELETED", message);
			io.to(user.socket_id).emit("SERVER:DIALOGUE_MESSAGE_UPDATE", dialogue._id, previousMessage);
		});
	}

	public async editMessage(data: EditMessage, io: SocketServer) {
		const { authorId, messageId, messageText } = data;

		const message = await MessageModel.findById(messageId);

		if (!message) {
			throw new Error("Сообщение не найдено");
		}

		if (message.author.toString() !== authorId) {
			throw new Error("Вы не являетесь автором данного сообщения");
		}

		const dialogue = await DialogueModel.findById(message.dialogue);

		if (!dialogue) {
			throw new Error("Диалог не найден");
		}

		await dialogue.populate("members", "socket_id");

		message.message = crypto.AES.encrypt(messageText, process.env.CRYPTO_KEY || "").toString();
		message.isEdited = true;

		await message.populate("author", "_id email fullName avatar avatarColors lastVisit isOnline");
		await message.save();

		if (dialogue.lastMessage.toString() === messageId) {
			return dialogue.members.forEach((user) => {
				io.to(user.socket_id).emit("SERVER:MESSAGE_EDITED", message);
				io.to(user.socket_id).emit("SERVER:DIALOGUE_MESSAGE_UPDATE", dialogue._id, message);
			});
		}

		return dialogue.members.forEach((user) => {
			io.to(user.socket_id).emit("SERVER:MESSAGE_EDITED", message);
		});
	}
}

export default new MessageService();
