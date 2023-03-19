import { Router } from "express";

// controller
import DialogueController from "../controllers/DialogueController.js";

// validation middleware
import paramsIdValidation from "../middleware/validations/paramsId.js";

// middleware
import isAuth from "../middleware/isAuth.js";
import updateLastVisit from "../middleware/updateLastVisit.js";
import updateIsOnline from "../middleware/updateIsOnline.js";

const dialogueController = new DialogueController();
const router = Router();

router.get("/all", isAuth, updateIsOnline, updateLastVisit, dialogueController.getDialogues);
router.post("/create", isAuth, updateIsOnline, updateLastVisit, dialogueController.createDialogue);
router.delete(
	"/:id",
	isAuth,
	paramsIdValidation,
	updateIsOnline,
	updateLastVisit,
	dialogueController.removeDialogueByAuthorId
);

export default router;
