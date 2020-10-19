const User = require('../models/User');

const login = (email) => {
        try {
        return User.authorize(email)
        .then((user) => {
        try{
        return user.authToken();
        }
        catch(err){
         return err;
        }
        })
        .then((token) => {
        return User.findByAuthToken(token)
        })
        }
        catch(err){
          return err;
        }
}

module.exports = login;