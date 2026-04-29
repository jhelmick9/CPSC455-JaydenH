exports.index = (req, res) => {
  res.render('index');
};

exports.about = (req, res) => {
  res.render('Trades/about');
};

exports.contact = (req, res) => {
  res.render('Trades/contact');
};

exports.login = (req, res) => {
  res.render('Partials/user/login');
};

exports.signup = (req, res) => {
  res.render('Partials/user/signup');
};
