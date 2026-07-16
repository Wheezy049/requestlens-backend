import { Router } from "express";
import { register, login, googleLogin } from "../controllers/auth.controller.js";
const authRouter = Router();
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/google", googleLogin);
export default authRouter;
