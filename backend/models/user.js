var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var userSchema = new mongoose.Schema({
    email: String,
    username: String,
    password: String,
    name: String,
    birthdate: Date,
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    // Campos para autenticação do Facebook
    facebook: {
        id: String,
        token: String
    },
    // Campos para autenticação do Google
    google: {
        id: String,
        token: String
    }
}, { versionKey: false });

// Define middleware before creating the model
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Define methods before creating the model
userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Export the model after defining all schema features
module.exports = mongoose.model('user', userSchema);