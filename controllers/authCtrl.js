const Users = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_APP,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});
const authCtrl = {
  checkExistsemail: async (req, res) => {
    try {
      const { email } = req.body;
      const existsEmail = await Users.findOne({ email });

      if (existsEmail)
        return res.status(400).json({ msg: 'This email aleardy exists !' });

      return res.status(200).json({ msg: 'Valid email' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  checkExistsemailForgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const existsEmail = await Users.findOne({ email });
      if (!existsEmail.password) {
        return res
          .status(400)
          .json({ msg: 'This email does not login with password' });
      }
      return res.status(200).json({
        msg: 'Check Email Forgot password successs!',
        user: existsEmail,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  checkExistUserName: async (req, res) => {
    try {
      const { username } = req.body;
      let newUserName = username.toLowerCase().replace(/ /g, '');
      const existsUserName = await Users.findOne({ username: newUserName });

      if (existsUserName)
        return res.status(400).json({ msg: 'Username aleardy exists !' });

      return res.status(200).json({ msg: 'Valid Username' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  register: async (req, res) => {
    try {
      const { fullname, username, email, password } = req.body;

      let newUserName = username.toLowerCase().replace(/ /g, '');

      const passwordHash = await bcrypt.hash(password, 12);

      const newUser = new Users({
        fullname,
        username: newUserName,
        email,
        password: passwordHash,
      });
      const user_name = await Users.findOne({ username: newUserName });
      if (user_name)
        return res.status(400).json({ msg: 'This user name already exists.' });

      const user_email = await Users.findOne({ email });
      if (user_email)
        return res.status(400).json({ msg: 'This email already exists.' });

      const access_token = createAccessToken({ id: newUser._id });
      const refresh_token = createRefreshToken({ id: newUser._id });

      res.cookie('refreshtoken', refresh_token, {
        httpOnly: true,
        path: '/api/auth/refresh_token',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30days
      });

      await newUser.save();

      res.json({
        msg: 'Register Success!',
        access_token,
        user: {
          ...newUser._doc,
          password: '',
        },
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  registerWhenLoginSocial: async (req, res) => {
    try {
      const { email, username, image } = req.body;
      const staticPart = 'user';

      let randomPart = Math.floor(1000000000 + Math.random() * 9000000000);
      const isUsernameExists = await Users.exists({
        username: `${staticPart}${randomPart}`,
      });
      while (isUsernameExists) {
        // Nếu đã tồn tại, random lại một số khác
        randomPart = Math.floor(1000000000 + Math.random() * 9000000000);
        isUsernameExists = await Users.exists({
          username: `${staticPart}${randomPart}`,
        });
      }

      let newUserName = username.toLowerCase().replace(/ /g, '');

      const newUser = new Users({
        fullname: newUserName,
        username: `${staticPart}${randomPart}`,
        email,
        avatar: image,
      }).populate('followers following', '-password');

      const user_email = await Users.findOne({ email }).populate(
        'followers following',
        '-password'
      );

      if (user_email) {
        const access_tokenExits = createAccessToken({ id: user_email._id });
        const refresh_tokenExits = createRefreshToken({ id: user_email._id });

        res.json({
          msg: 'Email already exists!',
          user: user_email,
          access_token: access_tokenExits,
          refresh_token: refresh_tokenExits,
        });
      } else {
        const access_token = createAccessToken({ id: newUser._id });
        const refresh_token = createRefreshToken({ id: newUser._id });
        res.cookie('refreshtoken', refresh_token, {
          httpOnly: true,
          path: '/api/auth/refresh_token',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30days
        });
        await newUser.save();

        res.json({
          msg: 'Register When login Social Success!!',
          access_token,
          refresh_token,
          user: {
            ...newUser._doc,
            password: '',
          },
        });
      }
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await Users.findOne({ email }).populate(
        'followers following',
        'avatar username fullname followers following'
      );

      if (!user)
        return res.status(400).json({ msg: 'This email doest not exists!' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ msg: 'Password is incorrect!' });
      const access_token = createAccessToken({ id: user._id });
      const refresh_token = createRefreshToken({ id: user._id });

      res.cookie('refreshtoken', refresh_token, {
        httpOnly: true,
        path: '/api/refresh_token',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30days
      });
      res.json({
        msg: 'Login Success!',
        access_token,
        refresh_token,
        user: {
          ...user._doc,
        },
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  logout: async (req, res) => {
    try {
      res.clearCookie('refreshtoken', { path: '/api/refresh_token' });
      return res.json({ msg: 'Logged out!' });
    } catch (e) {
      return res.status(500).json({ msg: err.message });
    }
  },
  generateAccessToken: async (req, res) => {
    try {
      const rf_token = req.cookies.refreshtoken;

      if (!rf_token) return res.status(400).json({ msg: 'Please login now.' });

      jwt.verify(
        rf_token,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, result) => {
          if (err) return res.status(400).json({ msg: 'Please login now.' });

          const user = await Users.findById(result.id)
            .select('-password')
            .populate(
              'followers following',
              'avatar username fullname followers following'
            );

          if (!user)
            return res.status(400).json({ msg: 'This does not exist.' });

          const access_token = createAccessToken({ id: result.id });

          res.json({
            access_token,
            user,
          });
        }
      );
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  refreshTokenTest: async (req, res) => {
    try {
      const rf_token = req.body;

      if (!rf_token.rf_token)
        return res.status(400).json({ msg: 'Please login now1.' });

      jwt.verify(
        rf_token.rf_token.toString(),
        process.env.REFRESH_TOKEN_SECRET,
        async (err, result) => {
          if (err) return res.status(400).json({ msg: 'Please login now2.' });

          const user = await Users.findById(result.id)
            .select('-password')
            .populate(
              'followers following',
              'avatar username fullname followers following'
            );

          if (!user)
            return res.status(400).json({ msg: 'This does not exist.' });

          const access_token = createAccessToken({ id: result.id });

          res.json({
            access_token,
            user,
          });
        }
      );
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const user = await Users.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'User not found!' });
      }

      const token = crypto.randomBytes(20).toString('hex');
      const expirationTime = Date.now() + 3600000; // Token hết hạn sau 1 giờ

      user.resetPasswordToken = token;
      user.resetPasswordExpires = expirationTime;
      await user.save();

      const resetPasswordLink = `${process.env.NEXT_PUBLIC_FE_BASE_URL_DEV}/reset-password/${token}`;

      const mailOptions = {
        from: 'hungsam2810@gmail.com',
        to: email,
        subject: 'Reset Password',
        html: `Click <a href="${resetPasswordLink}">here</a> to reset your password.`,
      };

      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          console.log('Error sending email:', error);
          return res.status(500).json({ msg: 'Failed to send email!' });
        }

        return res.json({ msg: 'Reset password email sent successfully!' });
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: 'Internal Server Error' });
    }
  },
  getAllUsers: async (req, res) => {
    try {
      const users = await Users.find();

      return res.json({
        msg: 'Get All User Success',
        users,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: 'Internal Server Error' });
    }
  },
  checkTokenValidity: async (req, res) => {
    try {
      const { token } = req.body;

      const user = await Users.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }, // Kiểm tra token còn hạn hay không
      });

      if (!user) {
        return res.status(400).json({ msg: 'Invalid or expired reset token!' });
      }

      return res.json({ msg: 'Reset token is valid!' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: 'Internal Server Error' });
    }
  },
  resetPassword: async (req, res) => {
    try {
      const { token } = req.query;

      const { newPassword } = req.body;

      const user = await Users.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }, // Kiểm tra token còn hạn hay không
      });

      if (!user) {
        return res.status(400).json({ msg: 'Invalid or expired reset token!' });
      }

      // Mã hóa password mới bằng bcrypt và lưu vào database
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      return res.json({ msg: 'Password reset successfully!' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: 'Internal Server Error' });
    }
  },
};

const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1d',
  });
};
const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '30d',
  });
};
module.exports = authCtrl;
const removeDuplicates = (arr, key) => {
  const uniqueMap = new Map();
  arr.forEach((item) => {
    if (!uniqueMap.has(item[key])) {
      uniqueMap.set(item[key], item);
    }
  });
  return Array.from(uniqueMap.values());
};
