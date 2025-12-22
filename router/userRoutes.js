import express from "express";
import { login, registerSchool } from "../controllers/userController.js";
import uploads from "../middleware/uploads.js";
const userRouter = express.Router();
userRouter.post("/register", uploads.single("image"), registerSchool);
userRouter.post("/login", login);
export { userRouter };
