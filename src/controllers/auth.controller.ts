import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service.js";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const { user, token} = await registerUser(email, password);

    const { password: _, ...safeUser } = user;

    res.status(201).json({
      message: "User created successfully",
      user: safeUser,
      token,
    });
  } catch (error: any) {
    const status = error.message === "User already exists" ? 409 : 400;
    res.status(status).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const data = await loginUser(email, password);

    const { password: _, ...safeUser } = data.user;

    res.json({
      message: "Login successful",
      ...data,
      user: safeUser,
    });
  } catch (error: any) {
    const status = error.message === "Invalid credentials" ? 401 : 400;
    res.status(status).json({ message: error.message });
  }
};