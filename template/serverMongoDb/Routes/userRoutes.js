const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken, restrictTo, checkIfFirstUser } = require('../middleware/authMiddleware');
const router = express.Router();

router.post("/login", userController.userLogin);
router.post("/register", checkIfFirstUser, userController.userSignup);

router.use(verifyToken);
router.use(verifyToken);
router.get("/", userController.getAllUsers);
router.post("/forget", userController.userForgotPassword);
router.post("/Reset", userController.userResetPassword);
router.get("/:id", userController.getUserById);
router.put("/:id", userController.EditUserById);
router.put("/:id/status", userController.toggleUserStatus);
router.delete("/:id", userController.deleteUserById);

module.exports = router;
