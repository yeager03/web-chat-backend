// model
import DialogueModel from "../models/DialogueModel.js";
import UserModel from "../models/UserModel.js";

// service
import MessageService from "./MessageService.js";

// types
import { CreateDialogue } from "./../controllers/DialogueController.js";
import { Server as SocketServer } from "socket.io";

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
      await dialogue.save();

      if (author.socket_id && interlocutor.socket_id) {
        io.to(author.socket_id).emit("SERVER:MESSAGE_CREATED", message);
        io.to(interlocutor.socket_id).emit("SERVER:MESSAGE_CREATED", message);

        io.to(author.socket_id).emit(
          "SERVER:DIALOGUE_MESSAGE_UPDATE",
          dialogue._id,
          message
        );
        io.to(interlocutor.socket_id).emit(
          "SERVER:DIALOGUE_MESSAGE_UPDATE",
          dialogue._id,
          message
        );
      }

      return dialogue;
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

      return new_dialogue;
    }
  }

  public async getDialogues(authorId: string) {
    const data = await DialogueModel.find({ members: authorId })
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

    return data;
  }

  // ?
  public async removeDialogue(authorId: string) {
    const dialogue = await DialogueModel.findOne({ author: authorId });

    if (!dialogue) {
      throw new Error("Диалог не найден");
    }

    return dialogue.deleteOne();
  }
}

export default new DialogueService();
