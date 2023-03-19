import { Schema, Document, model } from "mongoose";

// types
import { IDialogue } from "./DialogueModel.js";
import { IUser } from "./UserModel.js";

export interface IMessage extends Document {
	author: IUser["_id"];
	message: string;
	dialogue: IDialogue["_id"];
	unRead: boolean;
	// attachments: any[]
}

const MessageSchema = new Schema<IMessage>(
	{
		author: { type: Schema.Types.ObjectId, ref: "User", required: true },
		message: { type: String, required: true },
		dialogue: { type: Schema.Types.ObjectId, ref: "Dialogue", required: true },
		unRead: { type: Boolean, default: false },
	},
	{
		timestamps: true,
	}
);

const MessageModel = model("Message", MessageSchema);
export default MessageModel;
