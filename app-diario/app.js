var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var publicRouter = require('./routes/public');
var authRouter = require('./routes/auth');
var adminRouter = require('./routes/admin');
var winston = require('winston');

var app = express();

const loggerWinston = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/app.log' }),
  ],
});

// view engine setup
app.set('views', [
  path.join(__dirname, 'views/frontoffice'),
  path.join(__dirname, 'views/backoffice'),
  path.join(__dirname, 'views')
]);
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.on('finish', () => {
    if(res.statusCode >= 400) {
      loggerWinston.error({
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        timestamp: new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' }).substring(0, 20 )
      });
    }
    else
    loggerWinston.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      timestamp: new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' }).substring(0, 20)
    });
  });
  next();
});


app.use('/', publicRouter);
app.use('/auth', authRouter);
app.use('/admin', adminRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

console.log("Server started on port 8080...");

module.exports = app;
