import { Schema, Document, model } from "mongoose";

export interface IUser extends Document {
	email: string;
	fullName: string;
	avatar: string | null;
	avatarColors: {
		color: string;
		lighten: string;
	};
	password: string;
	isActivated: boolean;
	activationId: string;
	lastVisit: Date;
	isOnline: boolean;
}

const UserSchema = new Schema<IUser>(
	{
		email: { type: String, required: true, trim: true, unique: true },
		fullName: { type: String, required: true, trim: true },
		avatar: { type: String, default: null },
		avatarColors: { type: Object },
		password: { type: String, required: true, trim: true },
		isActivated: { type: Boolean, default: false },
		activationId: { type: String },
		lastVisit: { type: Date, default: new Date() },
		isOnline: { type: Boolean, default: false },
	},
	{
		timestamps: true,
	}
);

const UserModel = model("User", UserSchema);

export default UserModel;
