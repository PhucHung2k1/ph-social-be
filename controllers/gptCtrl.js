const Users = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');
// open AI
const API_KEY = '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';

const gptCtrl = {
  completions: async (req, res) => {
    const options = {
      method: 'post',
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'how are you?' }],
        max_tokens: 100,
      },
    };

    try {
      const response = await axios(options);
      res.send(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  },
};

module.exports = gptCtrl;
