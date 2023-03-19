// model
import UserModel from "../models/UserModel.js";

// service
import mailService from "./MailService.js";
import tokenService from "./TokenService.js";

// bcrypt
import bcrypt from "bcrypt";

// uuid
import { v4 as uuidv4 } from "uuid";

// utils
import UserDto from "../utils/dtos/UserDto.js";
import getRandomColors from "../utils/generateRandomColors.js";

// types
import { SignUpData, SignInData } from "../controllers/UserController.js";

class UserService {
	public async signUp(data: SignUpData) {
		const { email, fullName, password } = data;

		const candidate = await UserModel.findOne({ email }).lean();

		if (candidate) {
			throw new Error(`Пользователь с ${email} уже существует`);
		}

		const hashPassword = await bcrypt.hash(password, 10);
		const activationId = uuidv4();
		const avatarColors = getRandomColors();

		const user = new UserModel({
			email,
			fullName,
			password: hashPassword,
			activationId,
			avatarColors,
		});

		await user.save();
		await mailService.sendActivationMail(
			email,
			fullName.split(" ")[0],
			`${process.env.CLIENT_URL}/auth/activate/${activationId}`
		);
	}

	public async signIn(data: SignInData) {
		const { email, password } = data;

		const candidate = await UserModel.findOne({ email });

		if (!candidate) {
			throw new Error("Пользователь не найден");
		}

		const isPassEquals = await bcrypt.compare(password, candidate.password);

		if (!isPassEquals) {
			throw new Error("Неверный пароль, попробуйте снова");
		}

		if (!candidate["isActivated"]) {
			throw new Error("Пожалуйста, подтвердите свою почту");
		}

		const userDto = new UserDto(candidate);
		const tokens = tokenService.generateTokens({ ...userDto });

		await tokenService.saveToken(userDto._id, tokens.refreshToken);

		return {
			...tokens,
			user: userDto,
		};
	}

	public async logout(refreshToken: string) {
		const tokenFromDatabase = await tokenService.findToken(refreshToken);

		if (!tokenFromDatabase) {
			throw new Error("Токен не был найден");
		}

		return tokenService.removeToken(refreshToken);
	}

	public async findUserByEmail(email: string) {
		const candidate = await UserModel.findOne({ email });

		if (!candidate) {
			throw new Error("Пользователь с таким email не найден");
		}

		return { ...new UserDto(candidate) };
	}

	public async activateAccount(activationId: string) {
		const user = await UserModel.findOne({ activationId });

		if (!user) {
			throw new Error("Некорректная ссылка для активации");
		}

		user.isActivated = true;

		await user.save();
	}

	public async refreshAccount(refreshToken: string) {
		if (!refreshToken) {
			throw new Error("Пользователь не авторизован");
		}

		const userData = tokenService.validateRefreshToken(refreshToken);
		const tokenFromDatabase = await tokenService.findToken(refreshToken);

		if (!userData || !tokenFromDatabase) {
			await tokenService.removeToken(refreshToken);
			throw new Error("Пользователь не авторизован");
		}

		const user = await UserModel.findById(userData._id).lean();

		if (!user) {
			await tokenService.removeToken(refreshToken);
			throw new Error("Пользователь не найден");
		}

		const userDto = new UserDto(user);
		const tokens = tokenService.generateTokens({ ...userDto });

		await tokenService.saveToken(userDto._id, tokens.refreshToken);

		return {
			...tokens,
			user: userDto,
		};
	}

	public async getUserById(userId: string) {
		return UserModel.findById(userId).lean();
	}
}

export default new UserService();
