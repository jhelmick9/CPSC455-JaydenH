const mongoose = require('mongoose');
const userModel = require('../model/user');
const tradeModel = require('../model/trade');
const bcrypt = require('bcrypt');


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
        const [profileUser, trades] = await Promise.all([
            userModel.findById(userId).lean(),
            tradeModel.find({ author: userId }).sort({ createdAt: -1, name: 1 }).lean()
        ]);

        if (!profileUser) {
            req.session.user = null;
            req.flash('error', 'User not found. try again.');
            return res.redirect('/login');
        }

        return res.render('Partials/user/profile', { profileUser, trades });
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

exports.favorites = (req, res, next) => {
    const userId = req.session.user.id;
    const tradeId = req.params.id;

    tradeModel.findById(tradeId)
        .then((trade) => {
            if (!trade) {
                req.flash('error', 'Trade not found.');
                return res.redirect('/trades');
            }
            if (!trade.favorites) {
                trade.favorites = [];
            }
            if (trade.favorites.includes(userId)) {
                req.flash('error', 'Trade is already in favorites.');
                return res.redirect('back');
            }
            trade.favorites.push(userId);
            return trade.save();
        })
        .then(() => {
            req.flash('success', 'Trade added to favorites.');
            res.redirect('back');
        })
        .catch((error) => {
            next(error);
        });
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



