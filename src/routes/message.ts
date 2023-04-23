import { Router } from "express";

// controller
import MessageController from "../controllers/MessageController.js";

// validation middleware
import paramsIdValidation from "../middleware/validations/paramsId.js";

// middleware
import isAuth from "../middleware/isAuth.js";

// multer
import upload from "../core/multer.js";

const messageController = new MessageController();
const router = Router();

router.get("/all/:id", isAuth, paramsIdValidation, messageController.getMessages);
router.post("/create", isAuth, upload.array("files", 5), messageController.createMessage);
router.put("/edit/:id", isAuth, paramsIdValidation, upload.array("files", 5), messageController.editMessage);
router.delete("/remove/:id", isAuth, paramsIdValidation, messageController.removeMessage);

export default router;
