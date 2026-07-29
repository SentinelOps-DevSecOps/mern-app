const User = require('../../models/User');
const bcrypt = require('bcrypt');


const updatePassword = async (req, res, next) => {
    const { token, password, confirmPassword } = req.body;

    try {
        const findedUser = await User.findOne({ 'otp.token': token });
        if (!findedUser) {
            const error = new Error('Something went wrong, please try again');
            error.statusCode = 404;
            throw error; // If no user found with the given token, throw an error
        }

        // if (new Date(findedUser.otp.sendTime).getTime() + 5 * 60 * 1000 < new Date().getTime()) {
        //     const error = new Error('Something went wrong, please try again');
        //     error.statusCode = 404;
        //     throw error;
        // }

        if (password !== confirmPassword) {
            const error = new Error('Passwords do not match');
            error.statusCode = 400;
            throw error; // If passwords do not match, throw an error
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Hash the new password
        findedUser.password = hashedPassword; // Update the user's password
        findedUser.otp.otp = null; // Clear the OTP after successful password update
        findedUser.otp.token = null; // Clear the token after successful password update
        findedUser.otp.sendTime = null; // Clear the send time after successful password update


        console.log('Before:', findedUser.email);
        await findedUser.save();
        console.log('After:', findedUser.email);

        // console.log(findedUser);

        res.status(200).json({
            message: 'Password updated successfully',
            status: true
        });

    } catch (error) {
        next(error);
    }
};


module.exports = updatePassword;
