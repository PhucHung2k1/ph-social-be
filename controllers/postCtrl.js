const Posts = require('../models/postModel');
const Users = require('../models/userModel');
class APIfeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  paginating() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 30;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

const postCrl = {
  createPost: async (req, res) => {
    try {
      const { content, images, feelingStatus, feelingImage, isActivity } =
        req.body;
      if (images.length === 0) {
        return res.status(400).json({ msg: 'Please add your photo!' });
      }
      const newPost = new Posts({
        content,
        images,
        user: req.user._id,
        feelingStatus,
        feelingImage,
        isActivity,
      });
      await newPost.save();
      res.json({
        msg: 'Created post!',
        newPost: {
          ...newPost._doc,
          user: req.user,
        },
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  getPost: async (req, res) => {
    try {
      const post = await Posts.findById(req.params.id)
        .populate('user likes', 'avatar username fullname followers')
        .populate({
          path: 'comments',
          populate: {
            path: 'user likes',
            select: '-password',
          },
        });

      if (!post)
        return res.status(400).json({ msg: 'This post does not exist.' });

      res.json({
        post,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  getPosts: async (req, res) => {
    try {
      const posts = await Posts.find({
        user: [...req.user.following, req.user._id],
      })
        .sort('-createdAt')
        .populate('user likes', 'avatar username fullname followers')
        .populate({
          path: 'comments',
          populate: {
            path: 'user likes',
            select: '-password',
          },
        });
      res.json({
        msg: 'Success!',
        result: posts.length,
        posts,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getAllPosts: async (req, res) => {
    try {
      const posts = await Posts.find()
        .sort('-createdAt')
        .populate('user likes', 'avatar username fullname');

      res.json({
        msg: 'Success!',
        result: posts.length,
        posts,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  updatePost: async (req, res) => {
    try {
      const { content, images, feelingImage, feelingStatus, isActivity } =
        req.body;
      const post = await Posts.findOneAndUpdate(
        { _id: req.params.id },
        {
          content,
          images,
          feelingStatus,
          feelingImage,
          isActivity,
        }
      )
        .populate('user likes ', 'avatar username fullname ')
        .populate({
          path: 'comments',
          select: 'content createdAt likes postId postUserId _id',
          populate: {
            path: 'user',
            select: 'avatar username fullname',
          },
        });

      res.json({
        msg: 'Updated post!',
        newPost: {
          ...post._doc,
          content,
          images,
          feelingImage,
          feelingStatus,
          isActivity,
        },
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  likePost: async (req, res) => {
    try {
      const post = await Posts.find({
        _id: req.params.id,
        likes: req.user._id,
      });
      if (post.length > 0) {
        return res.status(400).json({ msg: 'You liked this post.' });
      }
      const like = await Posts.findOneAndUpdate(
        { _id: req.params.id },
        {
          $push: { likes: req.user._id },
        },
        { new: true }
      );
      if (!like)
        return res.status(400).json({ msg: 'This post does not exists!' });
      res.json({ msg: 'Liked post!' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  unLikePost: async (req, res) => {
    try {
      const like = await Posts.findOneAndUpdate(
        { _id: req.params.id },
        {
          $pull: { likes: req.user._id },
        },
        { new: true }
      );
      if (!like)
        return res.status(400).json({ msg: 'This post does not exists!' });
      res.json({ msg: 'Unliked post!' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  getUserPosts: async (req, res) => {
    try {
      const posts = await Posts.find({ user: req.params.id })
        .sort('-createdAt')
        .populate({
          path: 'comments likes',
          populate: {
            path: 'user',
            select: '-password',
          },
        })
        .populate({
          path: 'user',
          select: '-password',
        })
        .populate({
          path: 'comments',
          populate: [
            {
              path: 'likes',
              populate: {
                path: 'user',
                select: '-password',
              },
            },
            {
              path: 'user',
              select: '-password',
            },
          ],
        });
      res.json({ posts, result: posts.length });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  getPostsDicover: async (req, res) => {
    try {
      // const newArr = [...req.user.following, req.user._id]

      // const num  = req.query.num || 9

      // const posts = await Posts.aggregate([
      //     { $match: { user : { $nin: newArr } } },
      //     { $sample: { size: Number(num) } },
      // ])

      const features = new APIfeatures(Posts.find(), req.query).paginating();

      const posts = await features.query
        .find({ images: { $exists: true, $ne: [] } })
        .sort('-createdAt')
        .populate('user likes', 'avatar username fullname')
        .populate({
          path: 'comments',
          populate: {
            path: 'user likes',
            select: '-password',
          },
        });

      return res.json({
        msg: 'Success!',
        result: posts.length,
        posts,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  deletePost: async (req, res) => {
    try {
      const post = await Posts.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });
      if (post.comments.length > 0) {
        await Comments.deleteMany({ _id: { $in: post.comments } });
      }

      res.json({
        msg: 'Deleted Post!',
        newPost: {
          ...post._doc,
          user: req.user,
        },
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  savePost: async (req, res) => {
    try {
      const user = await Users.find({
        _id: req.user._id,
        saved: req.params.id,
      });
      if (user.length > 0)
        return res.status(400).json({ msg: 'You saved this post.' });

      const save = await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          $push: { saved: req.params.id },
        },
        { new: true }
      );

      if (!save)
        return res.status(400).json({ msg: 'This user does not exist.' });

      res.json({ msg: 'Saved Post!' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  unSavePost: async (req, res) => {
    try {
      const save = await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          $pull: { saved: req.params.id },
        },
        { new: true }
      );

      if (!save)
        return res.status(400).json({ msg: 'This user does not exist.' });

      res.json({ msg: 'unSaved Post!' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  getSavePosts: async (req, res) => {
    try {
      const features = new APIfeatures(
        Posts.find({
          _id: { $in: req.user.saved },
        }),
        req.query
      ).paginating();

      const posts = await features.query
        .find({ images: { $exists: true, $ne: [] } })
        .sort('-createdAt')
        .populate('user likes', 'avatar username fullname')
        .populate({
          path: 'comments',
          populate: {
            path: 'user likes',
            select: '-password',
          },
        });

      res.json({
        posts,
        result: posts.length,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};
module.exports = postCrl;
