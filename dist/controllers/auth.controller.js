import { registerUser, loginUser, loginWithGoogleUser } from "../services/auth.service.js";
export const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await registerUser(email, password);
        const { password: _, ...safeUser } = user;
        res.status(201).json({
            message: "User created successfully",
            user: safeUser,
            token,
        });
    }
    catch (error) {
        const status = error.message === "User already exists" ? 409 : 400;
        res.status(status).json({ message: error.message });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await loginUser(email, password);
        const { password: _, ...safeUser } = data.user;
        res.json({
            message: "Login successful",
            ...data,
            user: safeUser,
        });
    }
    catch (error) {
        const status = error.message === "Invalid credentials" ? 401 : 400;
        res.status(status).json({ message: error.message });
    }
};
export const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ message: "Google ID Token is required" });
        }
        const { user, token } = await loginWithGoogleUser(idToken);
        const { password: _, ...safeUser } = user;
        res.status(200).json({
            message: "Google login successful",
            user: safeUser,
            token,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message || "Google authentication failed" });
    }
};
