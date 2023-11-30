const router = require('express').Router();
const authCtrl = require('../controllers/authCtrl');

router.post('/register', authCtrl.register);

router.post('/login', authCtrl.login);

router.post('/logout', authCtrl.logout);

router.post('/refresh_token', authCtrl.generateAccessToken);
router.post('/refresh_token_test', authCtrl.refreshTokenTest);
router.post('/check_email', authCtrl.checkExistsemail);

router.post(
  '/check_email_forgot_password',
  authCtrl.checkExistsemailForgotPassword
);

router.post('/check_username', authCtrl.checkExistUserName);

router.post('/forgot_password', authCtrl.forgotPassword);

router.post('/register_social', authCtrl.registerWhenLoginSocial);

router.get('/get_users', authCtrl.getAllUsers);

router.post('/check_token', authCtrl.checkTokenValidity);

router.post('/reset_password', authCtrl.resetPassword);

// admin
router.post('/authenticate/login', authCtrl.loginAdmin);
module.exports = router;
