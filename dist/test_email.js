import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();
const resendApiKey = process.env.RESEND_API_KEY;
async function main() {
    console.log("Testing Resend API Key:", resendApiKey ? "Key is set" : "Key is NOT set");
    if (!resendApiKey) {
        console.error("Error: RESEND_API_KEY is not set in environment variables.");
        return;
    }
    const resend = new Resend(resendApiKey);
    try {
        console.log("Sending test email to olatoyesefaruq@gmail.com...");
        const { data, error } = await resend.emails.send({
            from: "RequestLens Alerts <onboarding@resend.dev>",
            to: "olatoyesefaruq@gmail.com",
            subject: "Test Resend Connection",
            html: "<p>If you see this, your Resend API integration works perfectly!</p>",
        });
        if (error) {
            console.error("Resend API returned error:", JSON.stringify(error, null, 2));
        }
        else {
            console.log("Resend API returned success:", JSON.stringify(data, null, 2));
        }
    }
    catch (err) {
        console.error("Resend client exception:", err.message || err);
    }
}
main();
