const mongoose = require('mongoose');
const userModel = require('../model/user');
const tradeModel = require('../model/trade');
const offerModel = require('../model/offer');
const tradesController = require('./tradesController');
const bcrypt = require('bcrypt');

function isCurrentUser(req, userId) {
    return req.session.user && req.session.user.id === userId;
}

exports.profile = async (req, res, next) => {
    if (!req.session.user) {
        req.flash('error', 'You must be signed in to view profile.');
        return res.redirect('/login');
    }

    const userId = req.session.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        req.session.user = null;
        req.flash('error', 'Your session is over. Please sign in again.');
        return res.redirect('/login');
    }

    try {
        const [profileUser, trades, outgoingOffers, incomingOffers] = await Promise.all([
            userModel.findById(userId).populate('favorites').lean(),
            tradeModel.find({ author: userId }).sort({ createdAt: -1, name: 1 }).lean(),
            offerModel.find({ user1: userId, status: { $ne: 'cancelled' } })
                .populate('card1')
                .populate('card2')
                .populate('user2')
                .sort({ createdAt: -1 })
                .lean(),
            offerModel.find({ user2: userId, status: { $ne: 'cancelled' } })
                .populate('card1')
                .populate('card2')
                .populate('user1')
                .sort({ createdAt: -1 })
                .lean()
        ]);

        if (!profileUser) {
            req.session.user = null;
            req.flash('error', 'User not found. try again.');
            return res.redirect('/login');
        }

        return res.render('Partials/user/profile', {
            profileUser,
            trades,
            outgoingOffers,
            incomingOffers
        });
    } catch (error) {
        return next(error);
    }
};

exports.signup = async (req, res, next) => {
    try {
        const {username, email, name, lastName, password} = req.body;
        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await userModel.findOne({ email: normalizedEmail });
        if (existingUser) {
            req.flash('error', 'That email is already used.');
            return res.redirect('back');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({
            username: username.trim(),
            email: normalizedEmail,
            name: name.trim(),
            lastName: lastName.trim(),
            password: hashedPassword
        });
        const savedUser = await newUser.save();
        req.session.user = {
            id: savedUser._id.toString(),
            name: `${savedUser.name} ${savedUser.lastName}`
        };
        req.flash('success', 'Account created successfully.');
        return res.redirect('/users/profile');
    } catch (error) {
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {})[0];
            req.flash('error', `${duplicateField || 'That value'} is already in use.`);
            return res.redirect('back');
        }

        if (error.name === 'ValidationError') {
            req.flash('error', 'signup failed.');
            return res.redirect('back');
        }

        return next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail || !password || password.length < 8) {
            req.flash('error', 'Please enter a valid email and password.');
            return res.redirect('back');
        }

        const user = await userModel.findOne({ email: normalizedEmail });
        if (!user) {
            req.flash('error', 'Email not found.');
            return res.redirect('back');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash('error', 'Wrong email or password.');
            return res.redirect('back');
        }

        req.session.user = {
            id: user._id.toString(),
            name: `${user.name} ${user.lastName}`
        };
        req.flash('success');
        return res.redirect('/');
    } catch (error) {
        next(error);
    }
};

exports.signout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/login');
    });
};

exports.createOffer = async (req, res, next) => {
    const userId = req.session.user.id;
    const { card1, card2 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(card1) || !mongoose.Types.ObjectId.isValid(card2)) {
        req.flash('error', 'Cannot select this card');
        return res.redirect('/trades');
    }

    if (card1 === card2) {
        req.flash('error', 'cant select the same card');
        return res.redirect(`/trades/${card2}/new`);
    }

    try {
        const [offeredCard, requestedCard] = await Promise.all([
            tradeModel.findById(card1),
            tradeModel.findById(card2)
        ]);

        if (!offeredCard || !requestedCard) {
            req.flash('error', 'card not found');
            return res.redirect('/trades');
        }

        if (!offeredCard.author || offeredCard.author.toString() !== userId) {
            req.flash('error', 'Has to be your own card');
            return res.redirect(`/trades/${card2}/new`);
        }

        if (!requestedCard.author || requestedCard.author.toString() === userId) {
            req.flash('error', 'cannot trade that card');
            return res.redirect(`/trades/${card2}`);
        }

        await offerModel.create({
            user1: userId,
            card1,
            user2: requestedCard.author,
            card2,
            status: 'pending'
        });

        await tradesController.updateCardsForOffer([card1, card2], 'pending');

        req.flash('success', 'successful.');
        return res.redirect('/users/profile');
    } catch (error) {
        return next(error);
    }
};

exports.getUserOffers = async (req, res, next) => {
    if (!isCurrentUser(req, req.params.userId)) {
        const err = new Error('Cannot view this offer.');
        err.status = 401;
        return next(err);
    }

    try {
        const offers = await offerModel.find({ user1: req.params.userId })
            .populate('card1')
            .populate('card2')
            .populate('user2')
            .sort({ createdAt: -1 })
            .lean();

        return res.json(offers);
    } catch (error) {
        return next(error);
    }
};

exports.getIncomingOffers = async (req, res, next) => {
    if (!isCurrentUser(req, req.params.userId)) {
        const err = new Error('Cannot view this offer.');
        err.status = 401;
        return next(err);
    }

    try {
        const offers = await offerModel.find({ user2: req.params.userId })
            .populate('card1')
            .populate('card2')
            .populate('user1')
            .sort({ createdAt: -1 })
            .lean();

        return res.json(offers);
    } catch (error) {
        return next(error);
    }
};

exports.manageOffer = async (req, res, next) => {
    const userId = req.session.user.id;
    const offerId = req.params.offerId;

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
        req.flash('error', 'Invalid offer.');
        return res.redirect('/users/profile');
    }

    try {
        const offer = await offerModel.findById(offerId)
            .populate('card1')
            .populate('card2')
            .populate('user1')
            .lean();

        if (!offer || offer.user2.toString() !== userId) {
            req.flash('error', 'Offer not found.');
            return res.redirect('/users/profile');
        }

        return res.render('Trades/manageOffer', { offer });
    } catch (error) {
        return next(error);
    }
};

exports.cancelOffer = async (req, res, next) => {
    const userId = req.session.user.id;
    const offerId = req.params.offerId;

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
        req.flash('error', 'Invalid offer.');
        return res.redirect('/users/profile');
    }

    try {
        const offer = await offerModel.findById(offerId);

        if (!offer || offer.user1.toString() !== userId) {
            req.flash('error', 'Cannot cancel this offer.');
            return res.redirect('/users/profile');
        }

        if (offer.status !== 'pending') {
            req.flash('error', 'Only pending offers can be cancelled.');
            return res.redirect('/users/profile');
        }

        await tradesController.updateCardsForOffer([offer.card1, offer.card2], 'Available');
        await offerModel.findByIdAndDelete(offerId);

        req.flash('success', 'Offer cancelled.');
        return res.redirect('/users/profile');
    } catch (error) {
        return next(error);
    }
};

exports.acceptOffer = async (req, res, next) => {
    const userId = req.session.user.id;
    const offerId = req.params.offerId;

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
        req.flash('error', 'Invalid offer.');
        return res.redirect('/users/profile');
    }

    try {
        const offer = await offerModel.findById(offerId);

        if (!offer || offer.user2.toString() !== userId) {
            req.flash('error', 'You can only accept offers sent to you.');
            return res.redirect('/users/profile');
        }

        if (offer.status !== 'pending') {
            req.flash('error', 'Only pending offers can be accepted.');
            return res.redirect('/users/profile');
        }

        offer.status = 'accepted';
        await offer.save();
        await tradesController.tradeAcceptedCards(offer);

        req.flash('success', 'Offer accepted.');
        return res.redirect('/users/profile');
    } catch (error) {
        return next(error);
    }
};

exports.rejectOffer = async (req, res, next) => {
    const userId = req.session.user.id;
    const offerId = req.params.offerId;

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
        req.flash('error', 'Invalid offer.');
        return res.redirect('/users/profile');
    }

    try {
        const offer = await offerModel.findById(offerId);

        if (!offer || offer.user2.toString() !== userId) {
            req.flash('error', 'You can only reject offers sent to you.');
            return res.redirect('/users/profile');
        }

        if (offer.status !== 'pending') {
            req.flash('error', 'Only pending offers can be rejected.');
            return res.redirect('/users/profile');
        }

        offer.status = 'rejected';
        await offer.save();
        await tradesController.updateCardsForOffer([offer.card1, offer.card2], 'Available');

        req.flash('success', 'Offer rejected.');
        return res.redirect('/users/profile');
    } catch (error) {
        return next(error);
    }
};

exports.isAuthor = (req, res, next) => {
    const userId = req.session.user.id;
    const tradeId = req.params.id;

    tradeModel.findById(tradeId)
        .then((trade) => {
            if (!trade) {
                req.flash('error', 'Trade not found.');
                return res.redirect('/trades');
            }
            if (!trade.author || trade.author.toString() !== userId) {
                const err = new Error('You are not authorized to acces.');
                err.status = 401;
                return next(err);
            }
            next();
        })
        .catch((error) => {
            next(error);
        });
};

exports.isLoggedin = (req, res, next) => {
    if (!req.session.user || !req.session.user.id) {
        req.flash('error', 'log in to continue.');
        return res.redirect('/login');
    }
    next();
};
