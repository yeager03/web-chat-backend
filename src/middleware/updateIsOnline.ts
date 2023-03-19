import { Response, NextFunction } from "express";

// model
import UserModel from "../models/UserModel.js";

// types
import { IRequest } from "../types/IRequest.js";

// date-fns
import { differenceInMinutes } from "date-fns";

export default async (req: IRequest, res: Response, next: NextFunction): Promise<Response | void> => {
	try {
		const id: string = req.user ? req.user._id : "";

		if (!id) {
			return next();
		}

		const user = await UserModel.findById(id);

		if (!user) {
			throw new Error(`User with id:${id} not found`);
		}

		user.isOnline = differenceInMinutes(new Date(), user.lastVisit) < 5;

		await user.save();
	} catch (error: any) {
		console.log(error.message);
	}

	return next();
};
