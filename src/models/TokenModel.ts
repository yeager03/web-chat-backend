import { Schema, Document, model } from "mongoose";

// types
import { IUser } from "./UserModel.js";

export interface IToken extends Document {
	user: IUser["_id"];
	refreshToken: string;
}

const TokenSchema = new Schema<IToken>(
	{
		user: { type: Schema.Types.ObjectId, ref: "User", required: true },
		refreshToken: { type: String, required: true },
	},
	{
		timestamps: true,
	}
);

const TokenModel = model("Token", TokenSchema);
export default TokenModel;
