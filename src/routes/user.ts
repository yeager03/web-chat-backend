import { Router } from "express";

// controller
import UserController from "../controllers/UserController.js";

// validations
import signUpValidation from "../middleware/validations/signUp.js";
import signInValidation from "../middleware/validations/signIn.js";

import paramsActivationIdValidation from "../middleware/validations/paramsActivationId.js";
import paramsEmailValidation from "../middleware/validations/paramsEmail.js";

import isAuth from "../middleware/isAuth.js";

const userController = new UserController();
const router = Router();

router.post("/signup", signUpValidation, userController.signUp);
router.post("/signin", signInValidation, userController.signIn);
router.post("/logout", userController.logout);
router.get("/refresh", userController.refreshAccount);

router.get("/find/:email", isAuth, paramsEmailValidation, userController.findUserByEmail);

router.get("/activate/:id", paramsActivationIdValidation, userController.activateAccount);
router.get("/mail/again/:email", paramsEmailValidation, userController.againSendActivateMail);
router.get("/password/reset/:email", paramsEmailValidation, userController.resetPassword);

export default router;
