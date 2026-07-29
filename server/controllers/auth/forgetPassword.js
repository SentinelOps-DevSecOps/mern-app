const User = require('../../models/User');
const crypto = require('crypto');
const sendMail = require('../../utils/sendMail'); // Assuming you have a utility function to send emails
const validator = require("validator");


const forgetPassword = async (req, res, next) => {

    const { email } = req.body;
    if (
        typeof email !== "string" ||
        !validator.isEmail(email)
    ) {
        const error = new Error("Invalid email");
        error.statusCode = 400;
        throw error;
    }

    try {
        const formatedEmail = email.toLowerCase();
        const queryEmail = String(formatedEmail);
        const findedUser = await User.findOne({
            email: queryEmail
        });
        if (!findedUser) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        const otpWaitTimeMs = 1 * 60 * 1000; // 5 minutes in milliseconds

        if (findedUser.otp.otp && (new Date().getTime() - new Date(findedUser.otp.sendTime).getTime()) < otpWaitTimeMs) {
            const timeElapsed = new Date().getTime() - new Date(findedUser.otp.sendTime).getTime();
            const timeLeft = Math.ceil((otpWaitTimeMs - timeElapsed) / 1000); // time left in seconds

            const error = new Error(`OTP already sent. Please wait ${timeLeft} second(s) before requesting a new one.`);
            error.statusCode = 400;
            throw error;
        }
        const otp = crypto.randomInt(
            100000,
            1000000
        );
        console.log('Generated OTP:', otp);

        const token = crypto.randomBytes(32).toString('hex'); // Generate a random token

        findedUser.otp.otp = otp;
        findedUser.otp.sendTime = new Date().getTime() + 1 * 60 * 1000;
        // Set the current time as the send time
        findedUser.otp.token = token; // Store the token in the user document
        console.log(findedUser);

        // Save the user with the new OTP and send time
        await findedUser.save();

        sendMail(otp, formatedEmail); // Send the OTP to the user's email

        res.status(200).json({
            message: 'OTP sent successfully',
            status: true, // For testing purposes, you can remove this in production
            token: token // Send the token back to the client
        });

    } catch (error) {
        console.log('Error in forgetPassword controller:', error.message);
        next(error); // Pass the error to the next middleware
    }
};




module.exports = forgetPassword;
