const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('.db');

const app = express();


app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI 
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

app.use((req, res, next) => {
  if (!req.session.currentOrder) req.session.currentOrder = [];
  if (!req.session.chatState) req.session.chatState = 'main';
  next();
});

app.get('/', (req, res) => {
  res.render('chat', { sessionId: req.sessionID });
});

app.use('/api/chat', require('./routes/chat'));
app.use('/api/payment', require('./routes/payment'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));