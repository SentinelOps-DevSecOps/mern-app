const express = require('express');
const router = express.Router();

// Home page controller
const getHomeController = require('../controllers/home/home.js');
const verifyToken = require('../middleware/verifyToken.js');

//Donor Regisration route
const receiverController = require('../controllers/home/receiver.js');
const DonorRegisterController = require('../controllers/home/donor.js');

// ChatBot Route
const chatBotController = require('../controllers/home/chatBot.js');

const FeedbackController = require('../controllers/pages/feedback.js');
const ContactController = require('../controllers/pages/contact.js');


// Home Page Route
// Home route is public
router.get('/home', verifyToken, getHomeController);
router.post('/donor/register', DonorRegisterController);
router.post('/donor/search-donors', receiverController);
router.post('/chat', chatBotController);
router.post('/feedback/form', FeedbackController);
router.post('/contactus', ContactController);


module.exports = router;
