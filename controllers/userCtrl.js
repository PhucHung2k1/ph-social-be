const Users = require('../models/userModel');

const userCtrl = {
  searchUser: async (req, res) => {
    try {
      const users = await Users.find({
        username: { $regex: req.query.username },
      })
        .limit(10)
        .select('fullname username avatar');

      res.json({ users });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  getUserById: async (req, res) => {
    try {
      const user = await Users.findById(req.params.id)
        .select('-password')
        .populate('followers following', '-password');
      if (!user) return res.status(400).json({ msg: 'User does not exists!' });

      const removeDupUser = removeDuplicates(user.following, 'id');

      const userUpdateNew = { ...user._doc, following: removeDupUser };

      res.json({ user: userUpdateNew });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  getUser: async (req, res) => {
    try {
      const user = await Users.findById(req.params.id)
        .select('-password')
        .populate('followers following', '-password');
      if (!user) return res.status(400).json({ msg: 'User does not exists!' });

      res.json({ user });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  updateAvatar: async (req, res) => {
    try {
      const { id, avatar } = req.body;
      if (!avatar) {
        return res.status(400).json({ msg: 'Please add your avatar' });
      }
      await Users.findByIdAndUpdate(
        { _id: id },
        {
          avatar,
        }
      );
      const user = await Users.findByIdAndUpdate(
        { _id: id },
        {
          avatar,
        }
      );
      res.json({ msg: 'Update success', user });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  updateCoverImage: async (req, res) => {
    try {
      const { id, coverImage } = req.body;
      if (!coverImage) {
        return res
          .status(400)
          .json({ msg: 'Please add your updateCoverImage' });
      }
      await Users.findByIdAndUpdate(
        { _id: id },
        {
          coverImage,
        }
      );
      const user = await Users.findByIdAndUpdate(
        { _id: id },
        {
          coverImage,
        }
      );
      res.json({ msg: 'Update success', user });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  updateProfile: async (req, res) => {
    try {
      const { id, fullname, mobilephone, address, website, story, sex } =
        req.body;
      if (!fullname || !mobilephone || !address) {
        return res.status(400).json({ msg: 'Please complete all filed!' });
      }
      await Users.findByIdAndUpdate(
        { _id: id },
        {
          fullname,
          mobile: mobilephone,
          address,
          website,
          story,
          gender: sex,
        }
      );
      const newUser = await Users.findByIdAndUpdate(
        { _id: id },
        {
          fullname,
          mobile: mobilephone,
          address,
          website,
          story,
          gender: sex,
        }
      );
      res.json({ msg: 'Update success', newUser });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  updateStory: async (req, res) => {
    try {
      const { id, story } = req.body;

      await Users.findByIdAndUpdate(
        { _id: id },
        {
          story,
        }
      );
      const newUser = await Users.findByIdAndUpdate(
        { _id: id },
        {
          story,
        }
      );
      res.json({ msg: 'Update success', newUser });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  follow: async (req, res) => {
    try {
      const user = await Users.find({
        _id: req.params.id,
        followers: req.user._id,
      });
      if (user.length > 0)
        return res.status(500).json({ msg: 'You followed this user.' });

      const newUser = await Users.findOneAndUpdate(
        { _id: req.params.id },
        {
          $push: { followers: req.user._id },
        },
        { new: true }
      ).populate('followers following', '-password');

      await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          $push: { following: req.params.id },
        },
        { new: true }
      );

      res.json({ newUser });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  unfollow: async (req, res) => {
    try {
      const newUser = await Users.findOneAndUpdate(
        { _id: req.params.id },
        {
          $pull: { followers: req.user._id },
        },
        { new: true }
      ).populate('followers following', '-password');

      await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          $pull: { following: req.params.id },
        },
        { new: true }
      );

      res.json({ newUser });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  suggestionsUser: async (req, res) => {
    try {
      const newArr = [...req.user.following, req.user._id];

      const num = req.query.num || 10;

      const users = await Users.aggregate([
        { $match: { _id: { $nin: newArr } } },
        { $sample: { size: Number(num) } },
        {
          $lookup: {
            from: 'users',
            localField: 'followers',
            foreignField: '_id',
            as: 'followers',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'following',
            foreignField: '_id',
            as: 'following',
          },
        },
      ]).project('-password');

      return res.json({
        users,
        result: users.length,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  updateVipUser: async (req, res) => {
    try {
      const updatedUser = await Users.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { role: 'vip' } },
        { new: true } // Trả về dữ liệu mới sau khi cập nhật
      );

      if (updatedUser) {
        console.log(`This user is already role VIP`);
      } else {
        console.log(`Not found user!`);
      }
      res.json({ msg: 'Update Role To Vip User Successful', updatedUser });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};
module.exports = userCtrl;
const removeDuplicates = (arr, key) => {
  const uniqueMap = new Map();
  arr.forEach((item) => {
    if (!uniqueMap.has(item[key])) {
      uniqueMap.set(item[key], item);
    }
  });
  return Array.from(uniqueMap.values());
};
