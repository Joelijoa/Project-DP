const { User } = require('./index');

const findUserByEmail = async (email) => {
    const user = await User.findOne({ where: { email }, raw: true });
    return user;
};

module.exports = { findUserByEmail };
