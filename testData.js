const User = require('./lib/models/User');
const user  = User.create({
email : 'dog@lclark.edu',
vocalStudent: false,
theoryStudent: false,
percussionStudent: false
})
module.exports = user;