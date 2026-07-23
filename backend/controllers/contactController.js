import Message from "../models/Message.js";
import { isValidEmail } from "../utils/validators.js";

export const createMessage = async (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
        res.status(400);
        throw new Error("Please fill all the fields");
    }
    if (!isValidEmail(email)) {
        res.status(400);
        throw new Error("Invalid email");
    }
    await Message.create({ name, email, subject, message });
    res.status(201).json({ message: "Message received — we'll get back to you soon" });
};
