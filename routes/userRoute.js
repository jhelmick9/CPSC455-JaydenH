const express = require('express');
const controller = require('../controllers/userController');

const router = express.Router();

router.get('/profile', controller.profile);

router.get('/signout', controller.isLoggedin, controller.signout);

router.post('/signup', controller.signup);

router.post('/login', controller.login);

router.post('/offers/create', controller.isLoggedin, controller.createOffer);

router.get('/offers/user/:userId', controller.isLoggedin, controller.getUserOffers);

router.get('/offers/incoming/:userId', controller.isLoggedin, controller.getIncomingOffers);

router.get('/offers/:offerId/manage', controller.isLoggedin, controller.manageOffer);

router.delete('/offers/:offerId', controller.isLoggedin, controller.cancelOffer);

router.post('/offers/:offerId/cancel', controller.isLoggedin, controller.cancelOffer);

router.put('/offers/:offerId/accept', controller.isLoggedin, controller.acceptOffer);

router.post('/offers/:offerId/accept', controller.isLoggedin, controller.acceptOffer);

router.put('/offers/:offerId/reject', controller.isLoggedin, controller.rejectOffer);

router.post('/offers/:offerId/reject', controller.isLoggedin, controller.rejectOffer);

module.exports = router;
