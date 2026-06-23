import jwt from "jsonwebtoken";
export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                message: "No token provided",
            });
        }
        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECRET || "secret";
        const decoded = jwt.verify(token, secret);
        // attach user to request
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};
