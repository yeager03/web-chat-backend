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

router.get(
	"/all/:id",
	isAuth,
	paramsIdValidation,
	updateLastVisit,
	updateIsOnline,
	messageController.getMessagesByDialogueId
);
router.post("/create", isAuth, updateIsOnline, updateLastVisit, messageController.createMessage);
router.delete("/:id", isAuth, paramsIdValidation, updateIsOnline, updateLastVisit, messageController.removeMessageById);

export default router;
