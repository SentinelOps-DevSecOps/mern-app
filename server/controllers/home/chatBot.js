const natural = require('natural');

const classifier = new natural.BayesClassifier();

// Train with basic examples
classifier.addDocument('hello', 'greeting');
classifier.addDocument('hi', 'greeting');
classifier.addDocument('hey', 'greeting');
classifier.addDocument('bye', 'farewell');
classifier.addDocument('goodbye', 'farewell');
classifier.addDocument('help', 'help');
classifier.train();

const chatBot = (req, res) => {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ reply: 'Please provide a valid text message.' });
    }

    const sanitizedMessage = message.trim().toLowerCase().slice(0, 500);
    const category = classifier.classify(sanitizedMessage);

    let reply = 'I didn’t understand that.';

    if (category === 'greeting') {
        reply = 'Hello! How can I help you today?';
    } else if (category === 'farewell') {
        reply = 'Goodbye! Take care!';
    } else if (category === 'help') {
        reply = 'Sure! Let me know what you need help with.';
    }

    res.json({ reply });
};

module.exports = chatBot;
