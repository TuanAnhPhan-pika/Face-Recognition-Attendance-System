const express = require('express');
const usersController = require('../controllers/users.controller');
const { adminAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', adminAuth, usersController.listUsers);
router.post('/', adminAuth, usersController.createUser);
router.post('/:id/face', adminAuth, usersController.addFace);
router.put('/:id', adminAuth, usersController.updateUser);
router.delete('/:id', adminAuth, usersController.deleteUser);

module.exports = router;
