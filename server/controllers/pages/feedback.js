const Feedback = require("../../models/Feedback");

const submitFeedback = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || typeof name !== 'string' || typeof email !== 'string') {
            return res.status(400).json({ error: "Name and email are required." });
        }

        const safeName = String(name).replace(/[<>]/g, '').trim();
        const safeEmail = String(email).trim().toLowerCase();
        const safeSubject = String(subject || '').replace(/[<>]/g, '').trim();
        const safeMessage = String(message || '').replace(/[<>]/g, '').trim();

        const newFeedback = new Feedback({
            name: safeName,
            email: safeEmail,
            subject: safeSubject,
            message: safeMessage
        });
        await newFeedback.save();

        res.status(201).json({ message: "Feedback submitted successfully.", name: safeName });
    } catch {
        return res.status(500).json({ error: "Failed to submit feedback." });
    }
};

module.exports = submitFeedback;
