import { NextFunction, Response } from "express";

// types
import { IRequest } from "../types/IRequest.js";

// service
import tokenService from "../services/TokenService.js";

export default (req: IRequest, res: Response, next: NextFunction): Response | void => {
	try {
		const authorizationHeader = req.headers.authorization;

		if (!authorizationHeader) {
			throw new Error("Пользователь не авторизован");
		}

		const accessToken = authorizationHeader.split(" ")[1];

		if (!accessToken) {
			throw new Error("Пользователь не авторизован");
		}

		const userData = tokenService.validateAccessToken(accessToken);

		if (!userData) {
			throw new Error("Данный токен недействителен для аутентификации");
		}

		req.user = userData;

		return next();
	} catch (error: any) {
		return res.status(401).json({
			status: "error",
			message: error.message,
		});
	}
};
