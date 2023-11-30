const router = require('express').Router();
const auth = require('../middleware/auth');

const usetCtrl = require('../controllers/userCtrl');
const userCtrl = require('../controllers/userCtrl');

router.get('/search', usetCtrl.searchUser);
router.get('/getUserById/:id', usetCtrl.getUserById);

router.patch('/updateAvatar', userCtrl.updateAvatar);
router.patch('/updateCoverImage', userCtrl.updateCoverImage);
router.patch('/updateProfile', userCtrl.updateProfile);
router.patch('/updateStory', userCtrl.updateStory);
router.patch('/user/:id/follow', auth, userCtrl.follow);
router.patch('/user/:id/unfollow', auth, userCtrl.unfollow);
router.get('/user/:id', auth, userCtrl.getUser);
router.get('/suggestionUser', auth, userCtrl.suggestionsUser);
router.get('/updateVipUser/:id', auth, userCtrl.updateVipUser);

module.exports = router;
