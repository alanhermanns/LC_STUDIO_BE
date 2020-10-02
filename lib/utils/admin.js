const secret = process.env.APP_SECRET_A;
const bcrypt = require('bcryptjs');

const validatePassword = (hash) => {
    bcrypt.compare(secret, hash)
    .then(result => {
        if(result == true) return true
        else throw new Error('NO NO NO, BAD PASSWORD, NOT GOOD')
    })
}

module.exports = {validatePassword}