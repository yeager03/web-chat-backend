import { Response, NextFunction } from "express";

// type
import { IRequest } from "../../types/IRequest.js";

// validator
import validator from "validator";

export default (req: IRequest, res: Response, next: NextFunction): Response | void => {
	const { senderId, recipientId } = req.body;

	if (!validator.default.isMongoId(senderId)) {
		return res.status(422).json({ status: "error", message: `Переданный id:${senderId} отправителя не валидный` });
	}

	if (!validator.default.isMongoId(recipientId)) {
		return res.status(422).json({ status: "error", message: `Переданный id:${recipientId} получателя не валидный` });
	}

	return next();
};
