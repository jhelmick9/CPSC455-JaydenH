const mongoose = require('mongoose');
const itemModel = require('../model/trade');
const userModel = require('../model/user');

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

exports.updateCardsForOffer = async (cardIds, status) => {
  return itemModel.updateMany(
    { _id: { $in: cardIds } },
    { status }
  );
};

exports.tradeAcceptedCards = async (offer) => {
  return Promise.all([
    itemModel.findByIdAndUpdate(offer.card1, {
      author: offer.user2,
      status: 'Available'
    }),
    itemModel.findByIdAndUpdate(offer.card2, {
      author: offer.user1,
      status: 'Available'
    })
  ]);
};

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

exports.newOffer = async (req, res, next) => {
  const cardId = req.params.id;
  const userId = req.session.user.id;

  if (!validateId(cardId, req, res, '/trades')) return;

  try {
    const requestedCard = await itemModel.findById(cardId).lean();

    if (!requestedCard) {
      return flashRedirect(req, res, 'That trade could not be found.', '/trades');
    }

    if (!requestedCard.author) {
      return flashRedirect(req, res, 'That card cannot be traded right now.', `/trades/${cardId}`);
    }

    if (requestedCard.author.toString() === userId) {
      return flashRedirect(req, res, 'You cannot trade for your own card.', `/trades/${cardId}`);
    }

    if (requestedCard.status && requestedCard.status !== 'Available') {
      return flashRedirect(req, res, 'That card is not available for trade.', `/trades/${cardId}`);
    }

    const userCards = await itemModel.find({
      author: userId,
      status: 'Available'
    }).sort({ name: 1 }).lean();

    return res.render('Trades/offer', { requestedCard, userCards });
  } catch (err) {
    return next(err);
  }
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

exports.favoriteList = async (req, res, next) => {
  const userId = req.session.user.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    req.session.user = null;
    req.flash('error', 'Your session is over. Please sign in again.');
    return res.redirect('/login');
  }

  try {
    const [profileUser, trades] = await Promise.all([
      userModel.findById(userId).populate('favorites').lean(),
      itemModel.find({ author: userId }).sort({ createdAt: -1, name: 1 }).lean()
    ]);

    if (!profileUser) {
      req.session.user = null;
      req.flash('error', 'Please log in again.');
      return res.redirect('/login');
    }

    return res.render('Partials/user/profile', {
      profileUser,
      trades,
      outgoingOffers: [],
      incomingOffers: []
    });
  } catch (error) {
    return next(error);
  }
};

exports.favorites = async (req, res, next) => {
  const userId = req.session.user.id;
  const tradeId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(tradeId)) {
    req.flash('error', 'Invalid trade.');
    return res.redirect('/trades');
  }

  try {
    const user = await userModel.findById(userId);
    const trade = await itemModel.findById(tradeId);

    if (!user) {
      req.flash('error', 'Please log in again.');
      return res.redirect('/login');
    }

    if (!trade) {
      req.flash('error', 'Trade not found.');
      return res.redirect('/trades');
    }

    const alreadyFavorite = user.favorites.some((favorite) => {
      return favorite.toString() === tradeId;
    });

    if (alreadyFavorite) {
      req.flash('error', 'Trade is already in favorites.');
      return res.redirect('back');
    }

    user.favorites.push(tradeId);
    await user.save();

    req.flash('success', 'Trade added to favorites.');
    return res.redirect('/users/profile');
  } catch (error) {
    return next(error);
  }
};

exports.removeFavorite = async (req, res, next) => {
  const userId = req.session.user.id;
  const tradeId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(tradeId)) {
    req.flash('error', 'Invalid trade.');
    return res.redirect('/users/profile');
  }

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      req.flash('error', 'Please log in again.');
      return res.redirect('/login');
    }

    user.favorites = user.favorites.filter((favorite) => {
      return favorite.toString() !== tradeId;
    });

    await user.save();

    req.flash('success', 'Trade removed from favorites.');
    return res.redirect('/users/profile');
  } catch (error) {
    return next(error);
  }
};
