const User = require('../../models/User');

const getAccess = async (req, res, next) => {

    const { token } = req.body;

    try {
        const findedUser = await User.findOne({ token });
        if (findedUser.otp.token === null) {
            const error = new Error('User not found');
            error.status = 404;
            throw error;
        }
        res.status(200).json({ message: 'Success', status: true });
    } catch (error) {
        next(error);
    }
}


module.exports = getAccess;
