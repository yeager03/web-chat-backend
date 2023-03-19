import { Response, NextFunction } from "express";

// type
import { IRequest } from "../../types/IRequest.js";

// validator
import validator from "validator";

export default (req: IRequest, res: Response, next: NextFunction): Response | void => {
	const activationId: string = req.params.id;

	if (!validator.default.isUUID(activationId)) {
		return res.status(422).json({ status: "error", message: `Переданный id:${activationId} не валидный` });
	}

	return next();
};
