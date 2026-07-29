const User = require('../../models/User');


const getOtpTime = async (req, res, next) => {
  const { token } = req.body;

  try {
    const findedUser = await User.findOne({ 'otp.token': token }).select('otp');
    if (!findedUser) {
      return res.status(404).json({ message: 'User not found', status: false });
    }

    // const sendTime = findedUser.otp?.sendTime;

    // if (!sendTime) {
    //   return res.status(400).json({ status: false });
    // }

    res.status(200).json({
      message: 'success',
      status: true,
      sendTime: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
};


module.exports = getOtpTime;
