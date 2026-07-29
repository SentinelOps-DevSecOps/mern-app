const User = require('../../models/User');

const home = async (req, res, next) => {
  try {
    const userId = req.user.userId; // Make sure req.user exists (from middleware)
    const user = await User.findById(userId).select('name');

    if (!user) {
      return res.status(404).json({ message: 'User not found', status: false });
    }

    res.status(200).json({ name: user.name, status: true });
  } catch (error) {
    console.log('Home controller error:', error.message);
    next(error);
  }
};

module.exports = home;
