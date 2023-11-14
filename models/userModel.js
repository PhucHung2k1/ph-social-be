const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
    },
    avatar: {
      type: String,
      default:
        'https://res.cloudinary.com/luuphuchung2810/image/upload/v1691742236/h-network/lzplsi1x9dyjtijuioyq.png',
    },
    coverImage: {
      type: String,
      default:
        'https://res.cloudinary.com/luuphuchung2810/image/upload/v1693559646/h-network/bolpd4dva4msvhc72uyv.jpg',
    },
    role: { type: String, default: 'user' },
    gender: { type: String, default: '' },
    mobile: { type: String, default: '' },
    address: { type: String, default: '' },
    story: {
      type: String,
      default: '',
      maxlength: 200,
    },
    website: { type: String, default: '' },
    followers: [{ type: mongoose.Types.ObjectId, ref: 'user' }],
    following: [{ type: mongoose.Types.ObjectId, ref: 'user' }],
    saved: [{ type: mongoose.Types.ObjectId, ref: 'user' }],
    resetPasswordToken: { type: String, default: '' },
    resetPasswordExpires: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('user', userSchema);
