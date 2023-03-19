import { Response, NextFunction } from "express";

// type
import { IRequest } from "../../types/IRequest.js";

// validator
import validator from "validator";

export default (req: IRequest, res: Response, next: NextFunction): Response | void => {
	const { email, password } = req.body;

	if (!email) {
		return res.status(422).json({ status: "error", message: "Введите email адрес" });
	} else if (!validator.default.isEmail(email)) {
		return res.status(422).json({ status: "error", message: "Некорректный email адрес" });
	}

	if (!password) {
		return res.status(422).json({ status: "error", message: "Введите пароль" });
	} else if (!validator.default.isLength(password, { min: 8 })) {
		return res.status(422).json({ status: "error", message: "Пароль должен содержать не менее 8 символов" });
	}

	return next();
};
