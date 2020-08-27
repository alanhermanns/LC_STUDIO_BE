const User = require('../models/User');

const login = (email) => {
   return User.authorize()
    .then((user) =>{
        return user.authToken()
    })
    .then((user) => {
        return user.findByAuthToken()
    })
}

module.exports = login;