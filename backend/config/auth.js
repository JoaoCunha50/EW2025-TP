module.exports = {
    // Estratégia local
    local: {
        secret: 'ew2025'
    },
    
    // Estratégia do Facebook
    facebook: {
        clientID: '1188053349215844',
        clientSecret: '7c237c88be8c241efadc3d74913c907d',
        callbackURL: 'http://localhost:3000/auth/facebook/callback',
        profileFields: ['id', 'emails', 'name']
    },
    
    // Estratégia do Google
    google: {
        clientID: '375934400371-l9cova8tg76cfg48rt5cen899vnbgp3s.apps.googleusercontent.com',
        clientSecret: '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',
        callbackURL: 'http://localhost:3000/auth/google/callback'
    }
};