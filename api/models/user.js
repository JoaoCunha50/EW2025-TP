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
    facebookId: String,
    googleId: String
}, { versionKey: false });

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('user', userSchema);