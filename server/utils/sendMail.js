const nodemailer = require('nodemailer');

const sendMail = (otp, email) => {

    try {

        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Your email address
                pass: process.env.EMAIL_PASS  // Your email password or app password
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'OTP for Password Reset',
            text: `Your OTP for password reset is ${otp}. It is valid for 5 minutes.`
        };

        transport.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                throw new Error('Failed to send OTP email');
            } else {
                console.log('Email sent successfully:', info.response);
            }
        });


    } catch (error) {
        console.log(error.message);

    }

}


module.exports = sendMail;
