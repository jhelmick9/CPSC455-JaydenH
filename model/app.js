const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const flash = require('connect-flash');
const mainRoute = require('../routes/mainRoute');
const tradeRoute = require('../routes/tradeRoute');
const userRoute = require('../routes/userRoute');


const app = express();
const port = 8080;
const rootDir = path.join(__dirname, '..');

app.set('view engine', 'ejs');
app.set('views', path.join(rootDir, 'views'));

app.use(express.static(rootDir));
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "ajfeirf90aeu9eroejfoefj",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/cards' }),
        cookie: {maxAge: 60*60*1000}
        })
);

app.use(flash());

app.use((req, res, next) => {
    res.locals.user = req.session.user||null;
    res.locals.isLoggedIn = Boolean(req.session.user && req.session.user.id);
    res.locals.errorMessages = req.flash('error');
    res.locals.successMessages = req.flash('success');
    next();
});

app.use('/', mainRoute);
app.use('/trades', tradeRoute);
app.use('/users', userRoute);

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
