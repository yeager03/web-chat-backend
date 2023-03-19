import { Response, NextFunction } from "express";

// validator
import validator from "validator";

// types
import { IRequest } from "../../types/IRequest.js";

export default (req: IRequest, res: Response, next: NextFunction): Response | void => {
	const id: string = req.params.id;

	if (!validator.default.isMongoId(id)) {
		return res.status(400).json({
			message: `Переданный id:${id} не валидный`,
		});
	}

	return next();
};
