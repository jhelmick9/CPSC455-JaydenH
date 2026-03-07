const express = require('express');
const controller = require('../controllers/tradesController');

const router = express.Router();

router.get('/', controller.index);

router.get('/new', controller.new);

router.post('/', controller.create);

router.get('/:id', controller.show);

router.get('/:id/edit', controller.edit);

router.post('/:id', controller.update);

router.post('/:id/delete', controller.delete);

module.exports = router;
