const router = require('express').Router();
const auth = require('../middleware/auth');
const postCtrl = require('../controllers/postCtrl');
router
  .route('/posts')
  .post(auth, postCtrl.createPost)
  .get(auth, postCtrl.getPosts)
  .get(auth, postCtrl.getPost);

router
  .route('/post/:id')
  .patch(auth, postCtrl.updatePost)
  .delete(auth, postCtrl.deletePost);

router.route('/post/:id').patch(auth, postCtrl.updatePost);
router.patch('/post/:id/like', auth, postCtrl.likePost);
router.patch('/post/:id/unlike', auth, postCtrl.unLikePost);
router.route('/allposts').get(auth, postCtrl.getAllPosts);
router.route('/user_posts/:id').get(auth, postCtrl.getUserPosts);
router.get('/post_discover', auth, postCtrl.getPostsDicover);
router.patch('/savePost/:id', auth, postCtrl.savePost);

router.patch('/unSavePost/:id', auth, postCtrl.unSavePost);

router.get('/getSavePosts', auth, postCtrl.getSavePosts);
module.exports = router;
