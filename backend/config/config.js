module.exports = {
    // Estratégia local
    local: {
        secret: 'ew2025'
    },
    
    // Estratégia do Facebook
    facebook: {
        clientID: '1013003990897975',
        clientSecret: 'f97eb0917bc1d5c2ca3652c2c116c805',
        callbackURL: 'http://localhost:3000/auth/facebook/callback',
    },
    
    // Estratégia do Google
    google: {
        clientID: '375934400371-l9cova8tg76cfg48rt5cen899vnbgp3s.apps.googleusercontent.com',
        clientSecret: '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',
        callbackURL: 'http://localhost:3000/auth/google/callback'
    }
};