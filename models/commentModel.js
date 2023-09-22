const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    tag: Object,
    reply: mongoose.Types.ObjectId,
    likes: [{ type: mongoose.Types.ObjectId, ref: 'user' }],
    user: { type: mongoose.Types.ObjectId, ref: 'user' }, // auth
    postId: mongoose.Types.ObjectId, // id cua post
    postUserId: mongoose.Types.ObjectId, // id cua chu bai dang
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('comment', commentSchema);
