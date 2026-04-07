const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const mainRoutes = require('../routes/mainRoute');
const tradeRoutes = require('../routes/tradeRoute');

const app = express();
const port = 8080;
const rootDir = path.join(__dirname, '..');

app.set('view engine', 'ejs');
app.set('views', path.join(rootDir, 'views'));

app.use(express.static(rootDir));
app.use(express.urlencoded({ extended: true }));

app.use('/', mainRoutes);
app.use('/trades', tradeRoutes);

app.use((req, res, next) => {
  const err = new Error(`The requested page ${req.originalUrl} was not found.`);
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('Trades/error', {
    error: {
      message: err.message || 'An unexpected error occurred.',
      status: err.status || 500
    }
  });
});

mongoose.connect('mongodb://localhost:27017/cards')
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log(err.message);
  });
