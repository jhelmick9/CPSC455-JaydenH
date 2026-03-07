const express = require('express');

const app = express();
const port = 8080;

app.set('view engine', 'ejs');
app.set('views', `${__dirname}/views`);

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

const tradeRoutes = require('./routes/tradeRoute');
const mainRoutes = require('./routes/mainRoute');

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

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
