const User = require('../models/User');

const login = (email) => {
   return User.authorize(email)
    .then((user) =>{
        return user.authToken();
    })
    .then((token) => {
        return User.findByAuthToken(token)
    })
}

module.exports = login;