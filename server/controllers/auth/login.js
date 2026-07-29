const User = require('../../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const formatedEmail = email.toLowerCase();
        const queryEmail = String(formatedEmail);
        const findedUser = await User.findOne({
            email: queryEmail
        });
        if (!findedUser) {
            const error = new Error('Invalid email');
            error.statusCode = 401;
            throw error;
        }

        // 2. Validate password
        const isPasswordValid = await bcrypt.compare(password, findedUser.password);
        if (!isPasswordValid) {
            const error = new Error('Incorrect password');
            error.statusCode = 401;
            throw error;
        }

        // 3. Generate JWT access token
        const accessToken = jwt.sign(
            { userId: findedUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 4. Respond with token
        res.status(200).json({
            message: 'Login successful',
            status: true,
            token: accessToken,
            name: findedUser.name
        });

    } catch (error) {
        next(error);
    }
};








module.exports = login;
