import { Schema, Document, model } from "mongoose";

// types
import { IFile } from "./FileModel.js";

export interface IUser extends Document {
	email: string;
	fullName: string;
	about_me: string | null;
	avatar: IFile["_id"] | null;
	avatarColors: {
		color: string;
		lighten: string;
	};
	password: string;
	passwordResetId: string | null;
	passwordResetIdExpiries: number | null;
	isActivated: boolean;
	activationId: string | null;
	activationIdExpiries: number | null;
	lastVisit: Date;
	isOnline: boolean;
	socket_id: string | null;
	requests: IUser["_id"][];
	friends: IUser["_id"][];
}

const UserSchema = new Schema<IUser>(
	{
		email: { type: String, required: true, trim: true, unique: true },
		fullName: { type: String, required: true, trim: true },
		about_me: { type: String, default: null },
		avatar: { type: Schema.Types.ObjectId, ref: "File", default: null },
		avatarColors: { type: Object },
		password: { type: String, required: true, trim: true },
		passwordResetId: { type: String || null, default: null },
		passwordResetIdExpiries: { type: Number || null, default: null },
		isActivated: { type: Boolean, default: false },
		activationId: { type: String, default: null },
		activationIdExpiries: { type: Number, default: null },
		lastVisit: { type: Date, default: new Date() },
		isOnline: { type: Boolean, default: false },
		socket_id: { type: String, default: null },
		requests: [{ type: Schema.Types.ObjectId, ref: "User" }],
		friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
	},
	{
		timestamps: true,
	}
);

const UserModel = model("User", UserSchema);

export default UserModel;
