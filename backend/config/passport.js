const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/user');
const authConfig = require('./config');

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      // Encontrar o utilizador pelo email
      const user = await User.findOne({ email: email });
      
      // Se o utilizador não existir
      if (!user) {
        return done(null, false, { message: 'Email não registado' });
      }
      
      // Verificar a senha
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return done(null, false, { message: 'Senha incorreta' });
      }
      
      // Sucesso
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Configuração da estratégia do Facebook
passport.use(new FacebookStrategy({
    clientID: authConfig.facebook.clientID,
    clientSecret: authConfig.facebook.clientSecret,
    callbackURL: authConfig.facebook.callbackURL,
    profileFields: ['id', 'displayName', 'email'],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ 'facebook.id': profile.id });
      if (user) {
        return done(null, user);
      }
      
      if (profile._json.email) {
        const email = profile._json.email;
        user = await User.findOne({ email: email });
        
        if (user) {
          // Atualizar com ID do Facebook
          user.facebook = {
            id: profile.id,
            token: accessToken
          };
          await user.save();
          return done(null, user);
        }
      }
      
      // Criar novo utilizador se não
      const newUser = new User({
        email: profile._json.email ? profile._json.email : '',
        name: profile.displayName,
        username: profile.id,
        facebook: {
          id: profile.id,
          token: accessToken
        },
        password: Math.random().toString(36).slice(-8)
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
      let user = await User.findOne({ 'google.id': profile.id });
      
      if (user) {
        return done(null, user);
      }

      if (profile.emails && profile.emails.length > 0) {
        const email = profile.emails[0].value;
        user = await User.findOne({ email: email });
        
        if (user) {
          // Atualizar com ID do Google
          user.google = {
            id: profile.id,
            token: token
          };
          await user.save();
          return done(null, user);
        }
      }
      
      // Criar novo utilizador se não existir
      const newUser = new User({
        email: profile.emails[0].value,
        name: profile.displayName,
        username: profile.id,
        google: {
          id: profile.id,
          token: token
        },
        password: Math.random().toString(36).slice(-8)
      });
      
      await newUser.save();
      return done(null, newUser);
    } catch (err) {
      return done(err);
    }
  }
));

// Configuração da estratégia JWT para autenticação via token
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: authConfig.local.secret
};

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
  try {
    const user = await User.findById(jwt_payload.id);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (err) {
    return done(err, false);
  }
}));

// Serialização e deserialização do utilizador para sessões
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;