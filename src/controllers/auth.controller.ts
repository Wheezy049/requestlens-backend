import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service.js";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const { user, token} = await registerUser(email, password);

    delete user.password; 

    res.status(201).json({
      message: "User created successfully",
      user,
      token,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const data = await loginUser(email, password);

    delete data.user.password;

    res.json({
      message: "Login successful",
      ...data,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};