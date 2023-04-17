import { Router } from "express";

// controller
import DialogueController from "../controllers/DialogueController.js";

// validation middleware
import paramsIdValidation from "../middleware/validations/paramsId.js";

// middleware
import isAuth from "../middleware/isAuth.js";

const dialogueController = new DialogueController();
const router = Router();

router.get("/all", isAuth, dialogueController.getDialogues);
router.post("/create", isAuth, dialogueController.createDialogue);
router.delete("/:id", isAuth, paramsIdValidation, dialogueController.removeDialogueByAuthorId);

export default router;
