var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressLayouts = require('express-ejs-Layouts');
var db = require('./Model/connection');
var session = require('express-session');
let echarts =require('echarts')





var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

var app = express();



// view engine setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/assets-admin')));

// app.use('/public', express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(expressLayouts)
app.use(logger('dev'));
app.use(express.json());

app.use(function nocache(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
})

app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(session({secret:'key',cookie:{maxAge:1200000}}));

db.connect((err)=>{
  if(err)console.log('connection error'+err)
  
  else console.log('Database connected')
  
})

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});




module.exports = app;
