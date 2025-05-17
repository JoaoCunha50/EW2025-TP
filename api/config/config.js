module.exports = {
    // Estratégia local
    local: {
        secret: 'ew2025'
    },
    
    // Estratégia do Facebook
    facebook: {
        clientID: '567838039251795',
        clientSecret: 'eafffdc720d6641c9eb5f8706bf5111c',
        callbackURL: 'http://localhost:3000/auth/facebook/callback',
    },
    
    // Estratégia do Google
    google: {
        clientID: '375934400371-l9cova8tg76cfg48rt5cen899vnbgp3s.apps.googleusercontent.com',
        clientSecret: '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',
        callbackURL: 'http://localhost:3000/auth/google/callback'
    }
};