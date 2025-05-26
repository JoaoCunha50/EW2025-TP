const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/user');
const authConfig = require('../config/config');

// Configuração da estratégia do Facebook
passport.use(new FacebookStrategy({
    clientID: authConfig.facebook.clientID,
    clientSecret: authConfig.facebook.clientSecret,
    callbackURL: authConfig.facebook.callbackURL,
    profileFields: ['id', 'displayName', 'email'],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ 'facebookId': profile.id });
      if (user) {
        return done(null, user);
      }
      
      if (profile._json.email) {
        const email = profile._json.email;
        user = await User.findOne({ email: email });
        
        if (user) {
          // Atualizar com ID do Facebook
          user.facebookId =  profile.id
          await user.save();
          return done(null, user);
        }
      }
      
      // Criar novo utilizador se não
      const newUser = new User({
        email: profile._json.email ? profile._json.email : '',
        name: profile.displayName,
        username: profile.id,
        facebookId: profile.id,
        password: Math.random().toString(36).slice(-8),
        biography: '...'
      });
      
      await newUser.save();
      return done(null, newUser);
    } catch (err) {
      return done(err);
    }
  }
));

// Configuração da estratégia do Google
passport.use(new GoogleStrategy({
    clientID: authConfig.google.clientID,
    clientSecret: authConfig.google.clientSecret,
    callbackURL: authConfig.google.callbackURL
  },
  async (token, tokenSecret, profile, done) => {
    try {
      let user = await User.findOne({ 'googleId': profile.id });
      
      if (user) {
        return done(null, user);
      }

      if (profile.emails && profile.emails.length > 0) {
        const email = profile.emails[0].value;
        user = await User.findOne({ email: email });
        
        if (user) {
          // Atualizar com ID do Google
          user.googleID = profile.id
          await user.save();
          return done(null, user);
        }
      }
      
      const newUser = new User({
        email: profile.emails[0].value,
        name: profile.displayName,
        username: profile.id,
        googleId: profile.id,
        password: Math.random().toString(36).slice(-8),
        biography: '...'
      });
      
      await newUser.save();
      return done(null, newUser);
    } catch (err) {
      return done(err);
    }
  }
));

const opts = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    (req) => {
      let token = null;
      if (req && req.cookies) {
        token = req.cookies.token;
      }
      return token;
    }
  ]),
  secretOrKey: authConfig.local.secret
};

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
  try {
    const user = await User.findOne({email: jwt_payload.email});
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (err) {
    return done(err, false);
  }
}));

module.exports = passport;