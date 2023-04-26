import { Response } from "express";

// types
import { IRequest } from "../types/IRequest.js";

// service
import userService from "../services/UserService.js";

// utils
import extractFields from "../utils/extractFields.js";

export type SignUp = {
	email: string;
	fullName: string;
	password: string;
};

export type SignIn = {
	email: string;
	password: string;
};

export type FriendRequest = {
	senderId: string;
	recipientId: string;
};

export type FriendRemove = {
	authorId: string;
	friendId: string;
};

export type EditProfile = {
	authorId: string;
	fullName: string;
	about_me: string;
	file: Express.Multer.File | undefined | null;
};

export default class UserController {
	public async signUp(req: IRequest, res: Response) {
		try {
			const data = extractFields(req.body, ["email", "fullName", "password"], true) as SignUp;
			await userService.signUp(data);

			return res.status(201).json({ status: "success", message: "Пользователь успешно создан" });
		} catch (error: any) {
			return res.status(400).json({ status: "error", message: error.message });
		}
	}

	public async signIn(req: IRequest, res: Response) {
		try {
			const data = extractFields(req.body, ["email", "password"]) as SignIn;
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

			return res.status(200).json({ status: "success", message: "Ваш аккаунт был успешно активирован!" });
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

	public async getFriends(req: IRequest, res: Response) {
		try {
			const userId: string = req.user ? req.user._id : "";

			const friends = await userService.getFriends(userId);

			return res.status(200).send({ status: "success", friends });
		} catch (error: any) {
			return res.status(400).json({ status: "error", message: error.message });
		}
	}

	public async getRequests(req: IRequest, res: Response) {
		try {
			const userId: string = req.user ? req.user._id : "";

			const requests = await userService.getRequests(userId);

			return res.status(200).send({ status: "success", requests });
		} catch (error: any) {
			return res.status(400).json({ status: "error", message: error.message });
		}
	}

	public async friendRequest(req: IRequest, res: Response) {
		try {
			const io = req.app.get("io");

			const senderId: string = req.user ? req.user._id : "";
			const recipientId: string = req.params.id;

			await userService.friendRequest({ senderId, recipientId }, io);

			return res.status(201).json({ status: "success", message: "Заявка в друзья успешно отправлена" });
		} catch (error: any) {
			return res.status(400).json({ status: "error", message: error.message });
		}
	}

	public async acceptRequest(req: IRequest, res: Response) {
		try {
			const io = req.app.get("io");

			const senderId: string = req.params.id;
			const recipientId: string = req.user ? req.user._id : "";

			await userService.acceptRequest({ senderId, recipientId }, io);

			return res.status(200).json({ status: "success", message: "Заявка в друзья принята" });
		} catch (error: any) {
			return res.status(400).json({ status: "error", message: error.message });
		}
	}

	public async denyRequest(req: IRequest, res: Response) {
		try {
			const senderId: string = req.params.id;
			const recipientId: string = req.user ? req.user._id : "";

			const name = await userService.denyRequest({ senderId, recipientId });

			return res.status(200).json({ status: "success", message: `${name} больше не подписан на вас` });
		} catch (error: any) {
			return res.status(400).json({ status: "error", message: error.message });
		}
	}

	public async removeFriend(req: IRequest, res: Response) {
		try {
			const io = req.app.get("io");

			const authorId: string = req.user ? req.user._id : "";
			const friendId: string = req.params.id;

			const name = await userService.removeFriend({ authorId, friendId }, io);

			return res.status(200).json({ status: "success", message: `${name} успешно удален из друзей` });
		} catch (error: any) {
			return res.status(400).json({ status: "error", message: error.message });
		}
	}

	public async editProfile(req: IRequest, res: Response) {
		try {
			const data = extractFields(req.body, ["fullName", "about_me"], true) as EditProfile;
			data.authorId = req.user ? req.user._id : "";
			data.file = req.file ? req.file : null;

			const user = await userService.editProfile(data);

			return res.status(200).json({ status: "success", message: "Вы успешно изменили профиль", user });
		} catch (error: any) {
			return res.status(400).json({ status: "error", message: error.message });
		}
	}
}
