var express = require('express');
var mongoose = require('mongoose');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/test');

var app = express();

var MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gittimus';
mongoose.connect(MONGO_URI)
  .then(function() { console.log('MongoDB connected:', MONGO_URI); })
  .catch(function(err) { console.error('MongoDB connection error:', err); process.exit(1); });

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use(function(_req, res) {
  res.status(404).json({ error: 'Not found' });
});

app.use(function(err, _req, res, _next) {
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

module.exports = app;
