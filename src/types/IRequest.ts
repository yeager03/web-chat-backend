import { Request } from "express";
import { Payload } from "../services/TokenService.js";

export interface IRequest extends Request {
	user?: Payload;
}
