var User = require('../models/user');

module.exports.list = () => {
    return User
        .find()
        .sort({ name: 1 })
        .exec();
}

module.exports.findByEmail = email => {
    return User
        .findOne({ email: email })
        .exec();
}

module.exports.findAdminByEmail = email => {
    return User
        .findOne({ email: email, role: 'admin' })
        .exec();
}

module.exports.findByUsername = username => {
    return User
        .findOne({ username: username })
        .exec();
}

module.exports.createUser = async (user) => {
    try {
        const existing = await User.findOne({ email: user.email }).exec();
        if (!existing) {
            var newUser = new User(user);
            return newUser.save();
        }
        return false;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

module.exports.updateUser = (email, user) => {
    return User
        .findOneAndUpdate(
            { email: email },
            user,
            { new: true }
        )
        .exec();
}

module.exports.removeUser = (email) => {
    return User
        .findOneAndDelete({ email: email })
        .exec();
}