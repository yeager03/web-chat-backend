import { Schema, Document, model } from "mongoose";

// types
import { IMessage } from "./MessageModel.js";
import { IUser } from "./UserModel.js";

export interface IFile extends Document {
	fileName: string;
	filePath: string;
	size: number;
	url: string;
	extension: string;
	author: IUser["_id"];
	message: IMessage["_id"];
}

const FileSchema = new Schema<IFile>(
	{
		fileName: { type: String, required: true },
		filePath: { type: String, required: true },
		size: { type: Number, required: true },
		url: { type: String, required: true },
		extension: { type: String, required: true },
		author: { type: Schema.Types.ObjectId, ref: "User", required: true },
		message: { type: Schema.Types.ObjectId, ref: "Message", required: true },
	},
	{
		timestamps: true,
	}
);

const FileModel = model("File", FileSchema);
export default FileModel;
