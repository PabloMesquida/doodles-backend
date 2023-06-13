import express from "express";
import * as UserController from "../controllers/users";
//import { requiresAuth } from "../middleware/auth";

const router = express.Router();

router.get("/", UserController.getAuthenticatedUser);

router.get("/:userId", UserController.getUser);

router.post("/signup", UserController.singUp);

router.post("/login", UserController.login);

router.post("/logout", UserController.logout);

export default router;
