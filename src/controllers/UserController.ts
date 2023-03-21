import { Response } from "express";

// types
import { IRequest } from "../types/IRequest.js";

// service
import userService from "../services/UserService.js";

// utils
import extractFields from "../utils/extractFields.js";

export type SignUpData = {
	email: string;
	fullName: string;
	password: string;
};

export type SignInData = {
	email: string;
	password: string;
};

export type NewPasswordData = {
	password: string;
};

export default class UserController {
	public async signUp(req: IRequest, res: Response) {
		try {
			const data = extractFields(req.body, ["email", "fullName", "password"], true) as SignUpData;
			await userService.signUp(data);

			return res.status(201).json({ status: "success", message: "Пользователь успешно создан" });
		} catch (error: any) {
			return res.status(400).json({ status: "error", message: error.message });
		}
	}

	public async signIn(req: IRequest, res: Response) {
		try {
			const data = extractFields(req.body, ["email", "password"]) as SignInData;
			const userData = await userService.signIn(data);

			res.cookie("refreshToken", userData.refreshToken, {
				maxAge: 1 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			});
			return res.status(200).json({ status: "success", message: "Вы успешно авторизованы", ...userData });
		} catch (error: any) {
			return res.status(400).json({ status: "error", message: error.message });
		}
	}

	public async logout(req: IRequest, res: Response) {
		try {
			const { refreshToken } = req.cookies;
			await userService.logout(refreshToken);

			res.clearCookie("refreshToken");
			return res.status(200).json({ status: "success" });
		} catch (error: any) {
			return res.status(400).json({ status: "error", message: error.message });
		}
	}

	public async refreshAccount(req: IRequest, res: Response) {
		try {
			const { refreshToken } = req.cookies;
			const userData = await userService.refreshAccount(refreshToken);

			res.cookie("refreshToken", userData.refreshToken, {
				maxAge: 1 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			});
			return res.status(200).json({ status: "success", message: "Вы успешно авторизованы", ...userData });
		} catch (error: any) {
			res.clearCookie("refreshToken");
			return res.status(401).json({ status: "error", message: error.message });
		}
	}

	public async findUserByEmail(req: IRequest, res: Response) {
		try {
			const email: string = req.params.email;
			const userData = await userService.findUserByEmail(email);

			return res.status(200).json({ status: "success", message: "Пользователь успешно найден", user: userData });
		} catch (error: any) {
			return res.status(401).json({ status: "error", message: error.message });
		}
	}

	public async activateAccount(req: IRequest, res: Response) {
		try {
			const activationId: string = req.params.id;

			await userService.activateAccount(activationId);

			return res.status(200).json({ status: "success", message: "Ваш аккаунт успешно активирован" });
		} catch (error: any) {
			return res.status(400).json(error);
		}
	}

	public async againSendActivateMail(req: IRequest, res: Response) {
		try {
			const email: string = req.params.email;

			await userService.againSendActivateMail(email);

			return res.status(200).json({
				status: "success",
				message: "На вашу почту было отправлено новое письмо с подтверждением аккаунта",
			});
		} catch (error: any) {
			return res.status(400).json(error);
		}
	}

	public async resetPassword(req: IRequest, res: Response) {
		try {
			const email: string = req.params.email;

			await userService.resetPassword(email);

			return res
				.status(200)
				.json({ status: "success", message: "На вашу почту было отправлено письмо со ссылкой для сброса пароля" });
		} catch (error: any) {
			return res.status(400).json({ status: "error", message: error.message });
		}
	}

	public async newPassword(req: IRequest, res: Response) {
		try {
			if (req.method === "GET") {
				const passwordResetId: string = req.params.id;

				await userService.newPassword("GET", passwordResetId);

				return res.status(200).json({ status: "success" });
			} else if (req.method === "POST") {
				const passwordResetId: string = req.params.id;
				const password: string = req.body.password.trim();

				await userService.newPassword("POST", passwordResetId, password);

				return res.status(200).json({ status: "success", message: "Пароль успешно изменен" });
			}
		} catch (error: any) {
			return res.status(400).json(error);
		}
	}
}
