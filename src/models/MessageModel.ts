import { Schema, Document, model } from "mongoose";

// types
import { IDialogue } from "./DialogueModel.js";
import { IUser } from "./UserModel.js";
import { IFile } from "./FileModel.js";

export interface IMessage extends Document {
  author: IUser["_id"];
  message: string | null;
  dialogue: IDialogue["_id"];
  isEdited: boolean;
  isRead: boolean;
  isReference: boolean;
  files: IFile["_id"][];
}

const MessageSchema = new Schema<IMessage>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, default: null },
    dialogue: { type: Schema.Types.ObjectId, ref: "Dialogue", required: true },
    isEdited: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },
    isReference: { type: Boolean, default: false },
    files: [{ type: Schema.Types.ObjectId, ref: "File" }],
  },
  {
    timestamps: true,
  }
);

const MessageModel = model("Message", MessageSchema);
export default MessageModel;
