import { Router } from "express";

// controller
import MessageController from "../controllers/MessageController.js";

// validation middleware
import paramsIdValidation from "../middleware/validations/paramsId.js";

// middleware
import isAuth from "../middleware/isAuth.js";

const messageController = new MessageController();
const router = Router();

router.get("/all/:id", isAuth, paramsIdValidation, messageController.getMessages);
router.post("/create", isAuth, messageController.createMessage);
router.put("/edit/:id", isAuth, paramsIdValidation, messageController.editMessage);
router.delete("/remove/:id", isAuth, paramsIdValidation, messageController.removeMessage);

export default router;
