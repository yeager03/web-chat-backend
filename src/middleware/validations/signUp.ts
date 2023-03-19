import { Response, NextFunction } from "express";

// type
import { IRequest } from "../../types/IRequest.js";

// validator
import validator from "validator";

type Pattern = {
	fullName: RegExp;
	password: RegExp;
};

const patterns: Pattern = {
	fullName: /^([а-яА-Яa-zA-Z]{2,}\s[а-яА-Яa-zA-Z]{1,}'?-?[а-яА-Яa-zA-Z]{2,}\s?([а-яА-Яa-zA-Z]{1,})?)/,
	password: /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/,
};

export default (req: IRequest, res: Response, next: NextFunction): Response | void => {
	const { email, fullName, password } = req.body;

	if (!email) {
		return res.status(422).json({ status: "error", message: "Введите email адрес" });
	} else if (!validator.default.isEmail(email)) {
		return res.status(422).json({ status: "error", message: "Некорректный email адрес" });
	}

	if (!fullName) {
		return res.status(422).json({ status: "error", message: "Введите полное имя" });
	} else if (!patterns.fullName.test(fullName)) {
		console.log(patterns.fullName);
		return res.status(422).json({ status: "error", message: "Имя или фамилия пользователя некорректны" });
	}

	if (!password) {
		return res.status(422).json({ status: "error", message: "Введите пароль" });
	} else if (!patterns.password.test(password)) {
		return res.status(422).json({
			status: "error",
			message:
				"Пароль должен содержать не менее 8 символов, в нем должны быть заглавные и строчные буквы, а также цифры",
		});
	}

	return next();
};
