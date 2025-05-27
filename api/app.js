var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose')
var passport = require('./utils/passport');
var session = require('express-session');
var cors = require('cors');
var auth = require('./config/config');
const { seedAdmin } = require('./config/dbSeed');

var mongoDB = 'mongodb://mongodb:27017/diario'
mongoose.connect(mongoDB)
var db = mongoose.connection
db.on('error', console.error.bind(console, "Erro de conexão ao MongoBD"))
db.once('open', () => console.log('Conexão ao MongoDB realizada com sucesso'))
seedAdmin();

var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth/auth');
var diaryRouter = require('./routes/diary')

var app = express();

app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração da sessão para passport
app.use(session({
  secret: auth.local.secret,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/users', usersRouter);
app.use('/auth', authRouter);
app.use('/api/diary', diaryRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({
    message: err.message,
    error: err
  });
});

module.exports = app;
