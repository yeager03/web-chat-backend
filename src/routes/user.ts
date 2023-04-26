import { Router } from "express";

// controller
import UserController from "../controllers/UserController.js";

// validations
import signUpValidation from "../middleware/validations/signUp.js";
import signInValidation from "../middleware/validations/signIn.js";

import paramsUuidValidation from "../middleware/validations/paramsUUID.js";
import paramsEmailValidation from "../middleware/validations/paramsEmail.js";

import paramsIdValidation from "../middleware/validations/paramsId.js";

import isAuth from "../middleware/isAuth.js";

// controller
const userController = new UserController();

// router
const router = Router();

// multer
import upload from "../core/multer.js";

router.post("/signup", signUpValidation, userController.signUp);
router.post("/signin", signInValidation, userController.signIn);
router.post("/logout", userController.logout);
router.get("/refresh", userController.refreshAccount);

router.get("/find/:email", isAuth, paramsEmailValidation, userController.findUserByEmail);

router.get("/activate/:id", paramsUuidValidation, userController.activateAccount);
router.get("/mail/again/:email", paramsEmailValidation, userController.againSendActivateMail);

router.get("/password/reset/:email", paramsEmailValidation, userController.resetPassword);
router.get("/password/new/:id", paramsUuidValidation, userController.newPassword);
router.post("/password/new/:id", paramsUuidValidation, userController.newPassword);

router.get("/friends", isAuth, userController.getFriends);
router.get("/requests", isAuth, userController.getRequests);

router.get("/friend/request/:id", isAuth, paramsIdValidation, userController.friendRequest);
router.get("/friend/accept/:id", isAuth, paramsIdValidation, userController.acceptRequest);
router.get("/friend/deny/:id", isAuth, paramsIdValidation, userController.denyRequest);
router.delete("/friend/remove/:id", isAuth, paramsIdValidation, userController.removeFriend);

router.post("/profile/edit", isAuth, upload("profile/").single("file"), userController.editProfile);

export default router;
