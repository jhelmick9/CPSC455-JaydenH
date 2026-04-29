const express = require('express');
const controller = require('../controllers/tradesController');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/', controller.index);

router.get('/new', userController.isLoggedin, controller.new);

router.post('/', userController.isLoggedin, controller.create);

router.get('/:id', controller.show);

router.get('/:id/edit', userController.isLoggedin, userController.isAuthor, controller.edit);

router.post('/:id', userController.isLoggedin, userController.isAuthor, controller.update);

router.post('/:id/delete', userController.isLoggedin, userController.isAuthor, controller.delete);

module.exports = router;
