import { Router } from "express";

// controller
import MessageController from "../controllers/MessageController.js";

// validation middleware
import paramsIdValidation from "../middleware/validations/paramsId.js";

// middleware
import isAuth from "../middleware/isAuth.js";
import updateLastVisit from "../middleware/updateLastVisit.js";
import updateIsOnline from "../middleware/updateIsOnline.js";

const messageController = new MessageController();
const router = Router();

router.get("/all/:id", isAuth, paramsIdValidation, updateLastVisit, updateIsOnline, messageController.getMessages);
router.post("/create", isAuth, updateIsOnline, updateLastVisit, messageController.createMessage);
router.put("/edit/:id", isAuth, paramsIdValidation, updateLastVisit, messageController.editMessage);
router.delete(
	"/remove/:id",
	isAuth,
	paramsIdValidation,
	updateIsOnline,
	updateLastVisit,
	messageController.removeMessage
);

export default router;
