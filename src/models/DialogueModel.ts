import { Schema, Document, model } from "mongoose";

// types
import { IUser } from "./UserModel.js";
import { IMessage } from "./MessageModel.js";

export interface IDialogue extends Document {
  members: IUser["_id"][];
  lastMessage: IMessage["_id"] | null;
  unreadMessagesCount: number;
}

const DialogueSchema = new Schema<IDialogue>(
  {
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message", default: null },
  },
  {
    timestamps: true,
  }
);

const DialogueModel = model("Dialogue", DialogueSchema);

export default DialogueModel;
