const router = require('express').Router();
const auth = require('../middleware/auth');
const postCtrl = require('../controllers/postCtrl');
router
  .route('/posts')
  .post(auth, postCtrl.createPost)
  .get(auth, postCtrl.getPosts)
  .delete(auth, postCtrl.deletePost);

router.route('/post/:id').patch(auth, postCtrl.updatePost);
router.patch('/post/:id/like', auth, postCtrl.likePost);
router.patch('/post/:id/unlike', auth, postCtrl.unLikePost);
router.route('/allposts').get(auth, postCtrl.getAllPosts);
router.route('/user_posts/:id').get(auth, postCtrl.getUserPosts);
router.get('/post_discover', auth, postCtrl.getPostsDicover);
module.exports = router;
