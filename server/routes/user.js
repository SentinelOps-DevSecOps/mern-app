const express = require('express');
const registerController = require('../controllers/auth/register');
const router = express.Router();
const loginController = require('../controllers/auth/login');
const forgetPasswordController = require('../controllers//auth/forgetPassword');
const verifyOtpController = require('../controllers/auth/verifyOtp.js');
const getOtpTimeController = require('../controllers/auth/getOtpTime.js');
const updatePasswordController = require('../controllers/auth/passwordUpdate');
const getAccessController = require('../controllers/auth/getAccess');

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/forget/password', forgetPasswordController);
router.post('/otp/verify', verifyOtpController);
router.post('/otp/time', getOtpTimeController);
router.post('/password/update', updatePasswordController);
router.post('/get/access', getAccessController);

module.exports = router;
