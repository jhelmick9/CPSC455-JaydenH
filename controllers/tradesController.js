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

function validateId(id, next) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('Invalid trade ID');
    err.status = 400;
    next(err);
    return false;
  }

  return true;
}

function handleDatabaseError(err, next) {
  if (err.name === 'ValidationError') {
    err.status = 400;
  } else {
    err.status = 500;
  }

  next(err);
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
  if (!validateId(req.params.id, next)) return;

  try {
    const item = await itemModel.findById(req.params.id);

    if (!item) {
      const err = new Error(`Cannot find an item with id ${req.params.id}`);
      err.status = 404;
      return next(err);
    }

    return res.render('Trades/trade', { item });
  } catch (err) {
    return next(err);
  }
};

exports.new = (req, res) => {
  res.render('Trades/newTrade');
};

exports.create = async (req, res, next) => {
  const trade = buildTrade(req.body);

  if (!trade.name || !trade.category || !trade.details) {
    const err = new Error('Name, catigories, and details are required to create an item.');
    err.status = 400;
    return next(err);
  }

  try {
    const item = await itemModel.create(trade);
    return res.redirect(`/trades/${item.id}`);
  } catch (err) {
    return handleDatabaseError(err, next);
  }
};

exports.edit = async (req, res, next) => {
  if (!validateId(req.params.id, next)) return;

  try {
    const item = await itemModel.findById(req.params.id);

    if (!item) {
      const err = new Error(`Cannot find an item with id ${req.params.id}`);
      err.status = 404;
      return next(err);
    }

    return res.render('Trades/edit', { item });
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  if (!validateId(req.params.id, next)) return;

  const trade = buildTrade(req.body);

  if (!trade.name || !trade.category || !trade.details) {
    const err = new Error('Name, catigories, and details are required to update an item.');
    err.status = 400;
    return next(err);
  }

  try {
    const updated = await itemModel.findByIdAndUpdate(req.params.id, trade, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      const err = new Error(`No item found with id ${req.params.id}`);
      err.status = 404;
      return next(err);
    }

    return res.redirect(`/trades/${req.params.id}`);
  } catch (err) {
    return handleDatabaseError(err, next);
  }
};

exports.delete = async (req, res, next) => {
  if (!validateId(req.params.id, next)) return;

  try {
    const deleted = await itemModel.findByIdAndDelete(req.params.id);

    if (!deleted) {
      const err = new Error(`No item found with id ${req.params.id}`);
      err.status = 404;
      return next(err);
    }

    return res.redirect('/trades');
  } catch (err) {
    err.status = 500;
    return next(err);
  }
};
