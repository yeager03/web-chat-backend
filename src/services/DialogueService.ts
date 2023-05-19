// model
import DialogueModel from "../models/DialogueModel.js";
import UserModel from "../models/UserModel.js";

// service
import MessageService from "./MessageService.js";

// types
import { CreateDialogue } from "./../controllers/DialogueController.js";
import { Server as SocketServer } from "socket.io";
import MessageModel from "../models/MessageModel.js";

class DialogueService {
  public async create(data: CreateDialogue, io: SocketServer) {
    const { authorId, interlocutorId, lastMessageText } = data;

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

    if (
      !author.friends.includes(interlocutorId) &&
      !interlocutor.friends.includes(authorId)
    ) {
      throw new Error("Вы не являетесь друзьями");
    }

    const dialogue = await DialogueModel.findOne({
      members: { $all: [authorId, interlocutorId] },
    });

    if (dialogue) {
      const message = await MessageService.create({
        messageAuthor: authorId,
        messageText: lastMessageText,
        dialogueId: dialogue._id,
        files: [],
      });

      dialogue.lastMessage = message._id;

      await dialogue.populate([
        {
          path: "members",
          select: "_id email fullName avatar avatarColors lastVisit isOnline",
          populate: {
            path: "avatar",
            select: "_id fileName url size extension",
            model: "File",
          },
        },
        {
          path: "lastMessage",
          populate: [
            {
              path: "author",
              model: "User",
              select:
                "_id email fullName avatar avatarColors lastVisit isOnline",
            },
          ],
        },
      ]);

      if (author.socket_id && interlocutor.socket_id) {
        io.to(author.socket_id).emit("SERVER:JOIN_TO_ROOM", dialogue._id);

        const roomClientsCount = io.sockets.adapter.rooms.get(
          dialogue._id.toString()
        )?.size;

        if (roomClientsCount && roomClientsCount >= 1) {
          message.isRead = true;
          await message.save();
        }

        io.to(author.socket_id).emit("SERVER:MESSAGE_CREATED", message, 2);
        io.to(interlocutor.socket_id).emit(
          "SERVER:MESSAGE_CREATED",
          message,
          2
        );

        io.to(author.socket_id).emit(
          "SERVER:DIALOGUE_MESSAGE_UPDATE",
          dialogue._id,
          message,
          2
        );
        io.to(interlocutor.socket_id).emit(
          "SERVER:DIALOGUE_MESSAGE_UPDATE",
          dialogue._id,
          message,
          2
        );
      }

      await dialogue.save();

      return {
        message: "Сообщение успешно отправлено",
        dialogue,
      };
    } else {
      const new_dialogue = await DialogueModel.create({
        members: [authorId, interlocutorId],
      });

      const message = await MessageService.create({
        messageAuthor: authorId,
        messageText: lastMessageText,
        dialogueId: new_dialogue._id,
        files: [],
      });

      new_dialogue.lastMessage = message._id;

      await new_dialogue.populate([
        {
          path: "members",
          select: "_id email fullName avatar avatarColors lastVisit isOnline",
          populate: {
            path: "avatar",
            select: "_id fileName url size extension",
            model: "File",
          },
        },
        {
          path: "lastMessage",
          populate: [
            {
              path: "author",
              model: "User",
              select:
                "_id email fullName avatar avatarColors lastVisit isOnline",
            },
          ],
        },
      ]);
      await new_dialogue.save();

      if (author.socket_id && interlocutor.socket_id) {
        io.to(author.socket_id).emit("SERVER:DIALOGUE_CREATED", new_dialogue);
        io.to(interlocutor.socket_id).emit(
          "SERVER:DIALOGUE_CREATED",
          new_dialogue
        );

        io.to(author.socket_id).emit("SERVER:JOIN_TO_ROOM", new_dialogue._id);
      }
      return {
        message: "Диалог успешно создан",
        dialogue: new_dialogue,
      };
    }
  }

  public async getDialogues(authorId: string) {
    const dialogues = await DialogueModel.find({ members: authorId })
      .lean()
      .populate([
        {
          path: "members",
          select: "_id email fullName avatar avatarColors lastVisit isOnline",
          populate: {
            path: "avatar",
            select: "_id fileName url size extension",
            model: "File",
          },
        },
        {
          path: "lastMessage",
          populate: [
            {
              path: "author",
              model: "User",
              select:
                "_id email fullName avatar avatarColors lastVisit isOnline",
            },
            {
              path: "files",
              model: "File",
              select: "type",
            },
          ],
        },
      ]);

    if (dialogues.length) {
      for (let i = 0; i < dialogues.length; i++) {
        const dialogue = dialogues[i];
        const messages = await MessageModel.find({
          dialogue: dialogue._id,
          author: {
            $ne: authorId,
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
            if (!dialogue.unreadMessagesCount) {
              dialogue.unreadMessagesCount = 1;
            } else {
              dialogue.unreadMessagesCount = dialogue.unreadMessagesCount + 1;
            }
          }
        }
      }
    }

    return dialogues;
  }
}

export default new DialogueService();
