import { Response } from "express";

// service
import dialogueService from "../services/DialogueService.js";

// types
import { IRequest } from "../types/IRequest.js";

// utils
import extractFields from "../utils/extractFields.js";

export type CreateDialogue = {
  authorId: string;
  interlocutorId: string;
  lastMessageText: string;
};

export default class DialogueController {
  public async createDialogue(req: IRequest, res: Response) {
    try {
      const io = req.app.get("io");
      const data = extractFields(
        req.body,
        ["interlocutorId", "lastMessageText"],
        true
      ) as CreateDialogue;
      data.authorId = req.user ? req.user?._id : "";

      const { dialogue, message } = await dialogueService.create(data, io);

      return res.status(200).send({
        status: "success",
        message,
        dialogue,
      });
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

      return res.status(200).json({ status: "success", dialogues });
    } catch (error: any) {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }
  }
}
