// model
import MessageModel from "../models/MessageModel.js";
import DialogueModel from "../models/DialogueModel.js";
import UserModel from "../models/UserModel.js";

// service
import fileService from "../services/FileService.js";

// types
import { Server as SocketServer } from "socket.io";
import {
  CreateMessage,
  EditMessage,
  GetMessages,
  RemoveMessage,
} from "../controllers/MessageController.js";

// crypto
import crypto from "crypto-js";

// validation
import validator from "validator";

class MessageService {
  public async getMessages(data: GetMessages, io: SocketServer) {
    const { dialogueId, userId } = data;
    const existDialogue = await DialogueModel.findById(dialogueId).lean();

    if (!existDialogue) {
      throw new Error(`Диалог с id:${dialogueId} не найден`);
    }

    const notReadData = await MessageModel.find({
      dialogue: dialogueId,
      author: { $ne: userId },
      isRead: false,
    })
      .lean()
      .populate("author", "_id socket_id");

    if (notReadData.length) {
      const interlocutorSocketId = notReadData[0].author.socket_id;

      await MessageModel.updateMany(
        {
          dialogue: dialogueId,
          author: { $ne: userId },
        },
        {
          isRead: true,
        }
      );

      const user = await UserModel.findById(userId).lean().select("socket_id");

      if (user && user.socket_id) {
        io.to(user.socket_id).emit(
          "SERVER:UNREADMESSAGES_DESCREASE",
          notReadData.length
        );
      }

      io.to(interlocutorSocketId).emit(
        "SERVER:MESSAGES_READ",
        notReadData,
        dialogueId
      );
    }

    const messages = await MessageModel.find({ dialogue: dialogueId })
      .lean()
      .populate([
        "dialogue",
        {
          path: "author",
          select: "_id email fullName avatar avatarColors lastVisit isOnline",
          populate: {
            path: "avatar",
            select: "_id fileName url size extension",
            model: "File",
          },
        },
        {
          path: "files",
          select: "_id fileName url size extension type",
        },
      ]);

    return messages;
  }

  public async getUnreadMessagesCount(userId: string) {
    let count: number = 0;

    const dialogues = await DialogueModel.find({
      members: userId,
    })
      .lean()
      .select("_id");

    if (!dialogues.length) {
      return;
    }

    for (let i = 0; i < dialogues.length; i++) {
      const dialogue = dialogues[i];
      const messages = await MessageModel.find({
        dialogue: dialogue._id,
        author: {
          $ne: userId,
        },
      })
        .lean()
        .select("isRead");

      if (!messages.length) {
        return;
      }

      for (let j = 0; j < messages.length; j++) {
        const message = messages[j];

        if (!message.isRead) {
          count++;
        }
      }
    }

    return count;
  }

  public async create(data: CreateMessage, io: SocketServer | null = null) {
    const { messageAuthor, messageText, dialogueId, files } = data;

    const dialogue = await DialogueModel.findById(dialogueId);

    if (!dialogue) {
      throw new Error(`Диалог с id:${dialogueId} не найден`);
    }

    if (!messageText && !files?.length) {
      throw new Error("Сообщение не может быть пустым");
    }

    const messageValue = messageText.trim()
      ? crypto.AES.encrypt(messageText, process.env.CRYPTO_KEY || "").toString()
      : null;

    const isReference = messageText.trim()
      ? validator.default.isURL(messageText)
      : false;

    const message = new MessageModel({
      author: messageAuthor,
      message: messageValue,
      dialogue: dialogueId,
      files: [],
      isReference,
    });
    dialogue.lastMessage = message._id;

    const uploadedFiles = files?.length
      ? await fileService.createFile(
          files,
          messageAuthor,
          "messages",
          message._id,
          dialogue._id
        )
      : [];

    message.files = uploadedFiles;

    await message.save();

    await message.populate([
      {
        path: "author",
        select: "_id email fullName avatar avatarColors lastVisit isOnline",
        populate: {
          path: "avatar",
          select: "_id fileName url size extension",
          model: "File",
        },
      },
      {
        path: "files",
        select: "_id fileName url size extension type",
      },
    ]);

    await dialogue.save();
    await dialogue.populate("members", "socket_id");

    if (io) {
      const roomClientsCount = io.sockets.adapter.rooms.get(dialogueId)?.size;

      dialogue.members.forEach((user) => {
        io.to(user.socket_id).emit(
          "SERVER:MESSAGE_CREATED",
          message,
          roomClientsCount
        );
        io.to(user.socket_id).emit(
          "SERVER:DIALOGUE_MESSAGE_UPDATE",
          dialogueId,
          message,
          roomClientsCount
        );
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

    const previousMessage = await MessageModel.findOne({
      _id: { $lt: messageId },
      dialogue,
    }).sort({
      _id: -1,
    });
    const lastMessageId = dialogue.lastMessage.toString();

    if (lastMessageId === messageId) {
      dialogue.lastMessage = previousMessage;
    }

    if (!previousMessage) {
      await message.deleteOne();
      message.files.length &&
        (await fileService.removeFile(authorId, messageId));
      await dialogue.deleteOne();

      return dialogue.members.forEach((user) => {
        io.to(user.socket_id).emit("SERVER:MESSAGE_DELETED", message);
        io.to(user.socket_id).emit(
          "SERVER:DIALOGUE_MESSAGE_UPDATE",
          dialogue._id,
          previousMessage
        );
      });
    }

    await previousMessage.populate([
      {
        path: "author",
        select: "_id email fullName avatar avatarColors lastVisit isOnline",
        populate: {
          path: "avatar",
          select: "_id fileName url size extension",
          model: "File",
        },
      },
      {
        path: "files",
        select: "_id fileName url size extension type",
      },
    ]);

    await dialogue.save();
    await message.deleteOne();
    message.files.length && (await fileService.removeFile(authorId, messageId));

    return dialogue.members.forEach((user) => {
      io.to(user.socket_id).emit("SERVER:MESSAGE_DELETED", message);
      io.to(user.socket_id).emit(
        "SERVER:DIALOGUE_MESSAGE_UPDATE",
        dialogue._id,
        previousMessage
      );
    });
  }

  public async editMessage(data: EditMessage, io: SocketServer) {
    const { messageAuthorId, messageId, messageText, files } = data;

    const message = await MessageModel.findById(messageId);

    if (!message) {
      throw new Error("Сообщение не найдено");
    }

    if (message.author.toString() !== messageAuthorId) {
      throw new Error("Вы не являетесь автором данного сообщения");
    }

    const dialogue = await DialogueModel.findById(message.dialogue);

    if (!dialogue) {
      throw new Error("Диалог не найден");
    }

    await dialogue.populate("members", "socket_id");

    message.message = messageText.trim()
      ? crypto.AES.encrypt(messageText, process.env.CRYPTO_KEY || "").toString()
      : null;

    message.isReference = messageText.trim()
      ? validator.default.isURL(messageText)
      : false;

    await fileService.removeFile(messageAuthorId, messageId);

    message.files = files?.length
      ? await fileService.createFile(
          files,
          messageAuthorId,
          "messages",
          messageId,
          dialogue._id
        )
      : [];

    message.isEdited = true;

    await message.save();
    await message.populate([
      {
        path: "author",
        select: "_id email fullName avatar avatarColors lastVisit isOnline",
        populate: {
          path: "avatar",
          select: "_id fileName url size extension",
          model: "File",
        },
      },
      {
        path: "files",
        select: "_id fileName url size extension type",
      },
    ]);

    if (dialogue.lastMessage.toString() === messageId) {
      return dialogue.members.forEach((user) => {
        io.to(user.socket_id).emit("SERVER:MESSAGE_EDITED", message);
        io.to(user.socket_id).emit(
          "SERVER:DIALOGUE_MESSAGE_UPDATE",
          dialogue._id,
          message
        );
      });
    }

    return dialogue.members.forEach((user) => {
      io.to(user.socket_id).emit("SERVER:MESSAGE_EDITED", message);
    });
  }
}

export default new MessageService();
