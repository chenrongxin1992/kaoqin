var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const session = require('express-session')

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

var front = require('./routes/front/front')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ 
	resave: false, //添加 resave 选项  
  	saveUninitialized: true, //添加 saveUninitialized 选项 
    secret: 'secret',
    cookie:{ 
        maxAge: 1000*60*60*24
    }
}));
app.use(function(req,res,next){ 
    res.locals.user = req.session.user;   // 从session 获取 user对象
    res.locals.student = req.session.student
    /*var error = req.session.error;   //获取错误信息
    delete req.session.error;
    res.locals.message = "";   // 展示的信息 message
    if(error){ 
    	console.log('----- session error -----')
    	console.log(error)
        res.locals.message = '<div class="alert alert-danger" style="margin-bottom:20px;color:red;">'+error+'</div>';
    }*/
    next();  //中间件传递
});


app.use('/', index);
app.use('/users', users);
//前台
app.use('/front',front)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
