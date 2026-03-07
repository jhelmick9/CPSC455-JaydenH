const itemModel = require('../model/trade');

exports.index = (req, res) => {
  const items = itemModel.findTrades();
  const categories = itemModel.findCategories();
  res.render('Trades/trades', { items, categories });
};

exports.show = (req, res, next) => {
  const item = itemModel.findById(req.params.id);

  if (!item) {
    const err = new Error(`Cannot find an item with id ${req.params.id}`);
    err.status = 404;
    return next(err);
  }

  return res.render('Trades/trade', { item });
};

exports.new = (req, res) => {
  res.render('Trades/newTrade');
};

exports.create = (req, res, next) => {
  const { name, category, details, status, image, team, year, condition, grade } = req.body || {};

  if (!name || !category || !details) {
    const err = new Error('Name, category, and details are required to create an item.');
    err.status = 400;
    return next(err);
  }

  const created = itemModel.save({
    name: name.trim(),
    category: category.trim().toLowerCase(),
    details: details.trim(),
    status: (status || 'Available').trim(),
    image: (image || '/image.png').trim(),
    team: (team || '').trim(),
    year: year ? Number.parseInt(year, 10) : null,
    condition: (condition || grade || 'None').trim()
  });

  return res.redirect(`/trades/${created.id}`);
};

exports.edit = (req, res, next) => {
  const item = itemModel.findById(req.params.id);

  if (!item) {
    const err = new Error(`Cannot find an item with id ${req.params.id}`);
    err.status = 404;
    return next(err);
  }

  return res.render('Trades/edit', { item });
};

exports.update = (req, res, next) => {
  const { name, category, details, status, image, team, year, condition } = req.body || {};

  if (!name || !category || !details) {
    const err = new Error('Name, category, and details are required to update an item.');
    err.status = 400;
    return next(err);
  }

  const updated = itemModel.updateById(req.params.id, {
    name: name.trim(),
    category: category.trim().toLowerCase(),
    details: details.trim(),
    status: (status || 'Available').trim(),
    image: (image || '/image.png').trim(),
    team: (team || '').trim(),
    year: year ? Number.parseInt(year, 10) : null,
    condition: (condition || 'None').trim()
  });

  if (!updated) {
    const err = new Error(`No item found with id ${req.params.id}`);
    err.status = 404;
    return next(err);
  }

  return res.redirect(`/trades/${req.params.id}`);
};

exports.delete = (req, res, next) => {
  const deleted = itemModel.deleteById(req.params.id);

  if (!deleted) {
    const err = new Error(`No item found with id ${req.params.id}`);
    err.status = 404;
    return next(err);
  }

  return res.redirect('/trades');
};
