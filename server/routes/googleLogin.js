require('dotenv').config();
const express = require('express')
const session = require('express-session')
const cors = require('cors')
const passport = require('passport')
const crypto = require('crypto');
const { User } = require('../models/users');
const { Business} = require('../models/business');
const { Technician} = require('../models/technician');
const { Service} = require('../models/service');
const { Sign_In} = require('../models/sign_in');
const { Service_Record} = require('../models/service_record');


const GoogleStrategy = require('passport-google-oauth20').Strategy;
const port = 4000

const router = express.Router()

// ID for google OAUTH
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

function hash(input) {
    const hash = crypto.createHash('sha256');
    hash.update(input);
    return hash.digest('hex');
}

const callbackURL = process.env.NODE_ENV === 'production'
    ? `${process.env.APP_URL}/auth/google/callback`
    : `${process.env.APP_URL}:${process.env.SERVER_PORT}/auth/google/callback`;

// Passport configuration
passport.use(new GoogleStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: callbackURL,
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scope: ['profile', 'email']
}, (token, tokenSecret, profile, done) => {

    // Extract user email from the profile object
    const userEmail = profile.emails[0].value;
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

router.use(passport.initialize());
router.use(passport.session());

router.get('/', passport.authenticate('google', {
    scope: ['profile', 'email'],
}));

router.get('/callback', passport.authenticate('google', { failureRedirect: '/' }), async (req, res) => {
    try {
        const googleId = req.user.id;
        const email = req.user.emails[0].value;

        // Hash the Google ID and store it in the session
        req.session.hashedGoogleId = hash(googleId);
        req.session.loggedIn = true;

        // Search for the user in the database
        var user = await User.findOne({ googleId: googleId });
        if (!user) {
            // If the user does not exist, create a new user
            user = new User({
                email: email,
                googleId: googleId
            });

            await user.save();
        }

        req.session.user_id = user._id;

        res.redirect(`${process.env.APP_URL}`);
    } catch (error) {
        console.error('Error during authentication callback:', error);
        res.redirect(`${process.env.APP_URL}`);
    }
}
);

router.get('/logout', (req, res) => {
    res.render('Logout')
});

router.get('/logoutCallback', async(req, res) => {
    if (req.session.googleId === 1) {
        try {
            const sessionId = await User.find({googleId: 1})
            const businessList = await Business.find({owner: sessionId})
            console.log(businessList)
            businessList.forEach(async(givenBusiness) => {
                try {
                    await Business.findByIdAndDelete(givenBusiness._id)
                    await Service.deleteMany({business : givenBusiness._id})
                    await Sign_In.deleteMany({business : givenBusiness._id})
            
                    const techList = await Technician.find({business : givenBusiness._id})
                    techList.forEach(async(givenTech) => {
                        await Service_Record.deleteMany({technician: givenTech._id})
                    });
                    await Technician.deleteMany({business : givenBusiness._id})
                } catch(error) {
                    console.error(error);  
                }
            });
        } catch(error) {
            console.error(error);
        }
    }
    req.session.currentBusiness = undefined;
    req.session.user_id = undefined;
    req.session.loggedIn = false;
    req.logout((err) => {
        if (err) {
            // Handle error, e.g., logging or sending an error response
            console.error('Error during logout:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.redirect(`${process.env.APP_URL}`);
    });

    //res.status(200).json({});
}
);


module.exports = router