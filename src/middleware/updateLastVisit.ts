import { Response, NextFunction } from "express";

// model
import UserModel from "../models/UserModel.js";

// types
import { IRequest } from "../types/IRequest.js";

export default async (req: IRequest, res: Response, next: NextFunction): Promise<Response | void> => {
	try {
		const id: string = req.user ? req.user._id : "";

		// console.log(id);

		if (!id) {
			return next();
		}

		// console.log(req.user);

		const user = await UserModel.findById(id);

		if (!user) {
			throw new Error(`User with id:${id} not found`);
		}

		user.lastVisit = new Date();

		await user.save();
	} catch (error: any) {
		console.log(error.message);
	}

	return next();
};
