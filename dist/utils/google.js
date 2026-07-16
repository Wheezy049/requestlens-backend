import { OAuth2Client } from "google-auth-library";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
    console.warn("[Google SDK] Warning: GOOGLE_CLIENT_ID is not configured in environment variables.");
}
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
/**
 * Verifies a Google ID token and returns the payload containing user info.
 */
export async function verifyGoogleToken(idToken) {
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error("Invalid ID token payload");
        }
        return payload;
    }
    catch (error) {
        console.error("[Google SDK] Token verification failed:", error);
        throw new Error("Google authentication failed: " + (error.message || "Invalid token"));
    }
}
