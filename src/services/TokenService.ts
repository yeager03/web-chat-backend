// jwt
import jwt from "jsonwebtoken";

// model
import TokenModel from "../models/TokenModel.js";

export type Payload = {
	_id: string;
	email: string;
	fullName: string;
	avatar: string | null;
	avatarColors: {
		color: string;
		lighten: string;
	};
	lastVisit: Date;
};

class TokenService {
	public generateTokens(payload: Payload) {
		const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET || "", {
			expiresIn: process.env.JWT_ACCESS_EXPIRES,
		});
		const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || "", {
			expiresIn: process.env.JWT_REFRESH_EXPIRES,
		});

		return { accessToken, refreshToken };
	}

	public async saveToken(userId: string, refreshToken: string) {
		const tokenData = await TokenModel.findOne({ user: userId });

		if (tokenData) {
			tokenData.refreshToken = refreshToken;
			return tokenData.save();
		}

		const token = new TokenModel({
			user: userId,
			refreshToken,
		});

		return token.save();
	}

	public async removeToken(refreshToken: string) {
		return TokenModel.deleteOne({ refreshToken });
	}

	public async findToken(refreshToken: string) {
		return TokenModel.findOne({ refreshToken }).lean();
	}

	public validateAccessToken(token: string) {
		try {
			const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET || "");
			return userData as Payload;
		} catch (error) {
			return null;
		}
	}

	public validateRefreshToken(token: string) {
		try {
			const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET || "");
			return userData as Payload;
		} catch (error) {
			return null;
		}
	}
}

export default new TokenService();
