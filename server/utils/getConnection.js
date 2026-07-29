const mongoose=require('mongoose');

const getConnection = () => {
    try {
        mongoose.connect(process.env.MONGO_URL)
            .then(() => console.log('MongoDB connected'))
            .catch(err => console.error('MongoDB connection error:', err));
    } catch (error) {
        console.log('Error connecting to MongoDB:', error.message);
    }
}

module.exports = getConnection;
