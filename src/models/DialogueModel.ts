import { Schema, Document, model } from "mongoose";

// types
import { IUser } from "./UserModel.js";
import { IMessage } from "./MessageModel.js";

export interface IDialogue extends Document {
	author: IUser["_id"];
	interlocutor: IUser["_id"];
	lastMessage: IMessage["_id"] | string | null;
}

const DialogueSchema = new Schema<IDialogue>(
	{
		author: { type: Schema.Types.ObjectId, ref: "User", required: true },
		interlocutor: { type: Schema.Types.ObjectId, ref: "User", required: true },
		lastMessage: { type: Schema.Types.ObjectId || String, ref: "Message", default: null },
	},
	{
		timestamps: true,
	}
);

const DialogueModel = model("Dialogue", DialogueSchema);

export default DialogueModel;
