import { Response, NextFunction } from "express";

// type
import { IRequest } from "../../types/IRequest.js";

// validator
import validator from "validator";

export default (req: IRequest, res: Response, next: NextFunction): Response | void => {
	const email: string = req.query.email ? (req.query.email as string) : "";

	if (!email) {
		return res.status(422).json({ status: "error", message: `Введите email` });
	}

	if (!validator.default.isEmail(email)) {
		return res.status(422).json({ status: "error", message: `Введите корректный email адрес` });
	}

	return next();
};
