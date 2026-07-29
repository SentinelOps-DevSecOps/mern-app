const Feedback = require("../../models/Feedback");

const submitFeedback = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        const newFeedback = new Feedback({ name, email, subject, message });
        await newFeedback.save();

        res.status(201).json({ message: "Feedback submitted successfully.", name: name });
    } catch {
        return res.status(500).json({ e: "Failed to submit feedback." });
    }
};

module.exports = submitFeedback;
