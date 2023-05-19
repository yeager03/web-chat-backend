import { Router } from "express";

// controller
import DialogueController from "../controllers/DialogueController.js";

// middleware
import isAuth from "../middleware/isAuth.js";

const dialogueController = new DialogueController();
const router = Router();

router.get("/all", isAuth, dialogueController.getDialogues);
router.post("/create", isAuth, dialogueController.createDialogue);

export default router;
