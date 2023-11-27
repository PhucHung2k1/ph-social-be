require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const SocketServer = require('./socketServer');
const { PeerServer } = require('peer');
const { Configuration, OpenAIApi } = require('openai');
const API_KEY = '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';
const config = new Configuration({
  apiKey: API_KEY,
});
const app = express();
const openai = new OpenAIApi(config);

app.use(express.json());
app.use(cors());
app.use(cookieParser());

// endpoint for ChatGPT

app.post('/chat', async (req, res) => {
  const { prompt } = req.body;

  const completion = await openai.createCompletion({
    model: 'text-davinci-003',
    max_tokens: 512,
    temperature: 0,
    prompt: prompt,
  });
  res.send(completion.data.choices[0].text);
});

// Socket

const http = require('http').createServer(app);
const io = require('socket.io')(http);
io.on('connection', (socket) => {
  SocketServer(socket);
});

// app.post('/completions', async (req, res) => {
//   const options = {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${API_KEY}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       model: 'gpt-3.5-turbo',
//       messages: [{ role: 'user', content: 'how are you?' }],
//       max_tokens: 100,
//     }),
//   };
//   try {
//     const response = await fetch(
//       'https://api.openai.com/v1/chat/completions',
//       options
//     );
//     const data = await response.json();
//     res.send(data);
//   } catch (err) {
//     console.log(err);
//   }
// });

// Create peer server
PeerServer({ port: 3001, path: '/' });

// Routes
app.use('/api', require('./routes/authRouter'));
app.use('/api', require('./routes/userRouter'));
app.use('/api', require('./routes/postRouter'));
app.use('/api', require('./routes/commentRouter'));
app.use('/api', require('./routes/notifyRouter'));
app.use('/api', require('./routes/messageRouter'));
app.use('/api', require('./routes/gptRouter'));
const URI = process.env.MONGODB_URL;

mongoose.connect(
  URI,
  {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) throw err;
    console.log('Connected to mongodb');
  }
);

app.get('/', (req, res) => {
  res.json({ msg: 'hello' });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
}

const port = process.env.PORT || 5000;

http.listen(port, () => {
  console.log('Server is running on port', port);
});
