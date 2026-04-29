const express = require('express');
const controller = require('../controllers/userController');

const router = express.Router();

router.get('/profile', controller.profile);
router.get('/signout', controller.isLoggedin, controller.signout);
router.post('/signup', controller.signup);
router.post('/login', controller.login);

module.exports = router;
