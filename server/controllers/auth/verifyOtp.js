const User = require('../../models/User');


const verifyOtp = async (req, res, next) => {

    const { otp } = req.body;

    try {

        const findedUser = await User.findOne({ 'otp.otp': otp })
        if (!findedUser) {
            const error = new Error('Invalid OTP');
            error.statusCode = 400;
            throw error; // If no user found with the given OTP, throw an error
        }
        if (new Date(findedUser.otp.sendTime).getTime() < new Date().getTime()) {
            const error = new Error('OTP expired');
            error.statusCode = 400;
            throw error; // If the OTP has expired, throw an error
        }

        findedUser.otp.otp = null; // Clear the OTP after successful verification
        await findedUser.save(); // Save the user document to clear the OTP
        // If OTP is valid and not expired, proceed with the next steps
        res.status(200).json({
            message: 'OTP verified successfully',
            status: true,
            token: findedUser.otp.token // Send the token back to the client for further actions
        });


    } catch (error) {
        next(error);
    }

}

module.exports = verifyOtp;
