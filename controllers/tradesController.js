const mongoose = require('mongoose');
const itemModel = require('../model/trade');

function buildTrade(body = {}) {
  return {
    name: body.name || '',
    category: body.category || '',
    details: body.details || '',
    team: body.team || '',
    year: body.year ? Number.parseInt(body.year, 10) : null,
    condition: body.condition || body.grade || '',
    image: body.image || '/Picture/image.png',
    status: body.status || 'Available'
  };
}

function flashRedirect(req, res, message, redirectTo) {
  req.flash('error', message);
  return res.redirect(redirectTo);
}

function validateId(id, req, res, redirectTo) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    flashRedirect(req, res, 'Invalid trade ID.', redirectTo);
    return false;
  }

  return true;
}

function handleDatabaseError(err, req, res, redirectTo, next) {
  if (err.name === 'ValidationError') {
    return flashRedirect(req, res, 'Please complete the required trade fields.', 'back');
  }

  err.status = 500;
  return next(err);
}

exports.index = async (req, res, next) => {
  try {
    const items = await itemModel.find().sort({ category: 1, name: 1 });
    const topics = [...new Set(items.map((item) => item.category))];
    res.render('Trades/trades', { items, topics });
  } catch (err) {
    next(err);
  }
};

exports.show = async (req, res, next) => {
  if (!validateId(req.params.id, req, res, '/trades')) return;

  try {
    const item = await itemModel.findById(req.params.id);

    if (!item) {
      return flashRedirect(req, res, 'That trade could not be found.', '/trades');
    }

    const isOwner = Boolean(
      req.session.user &&
      req.session.user.id &&
      item.author &&
      item.author.toString() === req.session.user.id
    );

    return res.render('Trades/trade', { item, isOwner });
  } catch (err) {
    return next(err);
  }
};

exports.new = (req, res) => {
  res.render('Trades/newTrade');
};

exports.create = async (req, res, next) => {
  const trade = buildTrade(req.body);

  if (req.session.user && mongoose.Types.ObjectId.isValid(req.session.user.id)) {
    trade.author = req.session.user.id;
  }

  if (!trade.name || !trade.category || !trade.details) {
    return flashRedirect(req, res, 'Name, categories, and details are required to create an item.', 'back');
  }

  try {
    const item = await itemModel.create(trade);
    req.flash('success', 'Trade created successfully.');
    return res.redirect(`/trades/${item.id}`);
  } catch (err) {
    return handleDatabaseError(err, req, res, '/trades/new', next);
  }
};

exports.edit = async (req, res, next) => {
  if (!validateId(req.params.id, req, res, '/trades')) return;

  try {
    const item = await itemModel.findById(req.params.id);

    if (!item) {
      return flashRedirect(req, res, 'That trade could not be found.', '/trades');
    }

    return res.render('Trades/edit', { item });
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  if (!validateId(req.params.id, req, res, '/trades')) return;

  const trade = buildTrade(req.body);

  if (!trade.name || !trade.category || !trade.details) {
    return flashRedirect(req, res, 'Name, categories, and details are required to update an item.', 'back');
  }

  try {
    const updated = await itemModel.findByIdAndUpdate(req.params.id, trade, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return flashRedirect(req, res, 'That trade could not be found.', '/trades');
    }

    req.flash('success', 'Trade updated successfully.');
    return res.redirect(`/trades/${req.params.id}`);
  } catch (err) {
    return handleDatabaseError(err, req, res, `/trades/${req.params.id}/edit`, next);
  }
};

exports.delete = async (req, res, next) => {
  if (!validateId(req.params.id, req, res, '/trades')) return;

  try {
    const deleted = await itemModel.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return flashRedirect(req, res, 'That trade could not be found.', '/trades');
    }

    req.flash('success', 'Trade deleted successfully.');
    return res.redirect('/trades');
  } catch (err) {
    err.status = 500;
    return next(err);
  }
};

exports.favoriteList = (req, res, next) => {
  const userId = req.session.user.id;

  tradeModel.find({ favorites: userId })
    .then((trades) => {
      res.render('Trades/favorites', { trades });
    })
    .catch((error) => {
      next(error);
    });
};
