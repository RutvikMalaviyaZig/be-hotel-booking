import { User } from "../models/index.js";
import { Webhook } from "../config/constant.js";

// this file is not in use
const clerkWebhooks = async (req, res) => {
    try {
        const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
        const headers = {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"],
        };

        await webhook.verify(JSON.stringify(req.body), headers);

        const { type, data } = req.body;

        const userData = {
            _id: data.id,
            email: data.email_addresses[0].email_address,
            username: data.first_name + " " + data.last_name,
            image: data.image_url,
        }
        switch (type) {
            case "user.created": {
                await User.create(userData);
                break;
            }

            case "user.updated": {
                await User.findByIdAndUpdate(data.id, userData);
                break;
            }

            case "user.deleted": {
                await User.findByIdAndDelete(data.id);
                break;
            }

            default:
                break;
        }

        res.json({ success: true, message: "Webhook processed successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Webhook processing failed" });
    }
}

export default clerkWebhooks;
