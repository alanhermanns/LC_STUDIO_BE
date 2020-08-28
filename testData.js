const User = require('./lib/models/User');
require('./lib/utils/connect')();

const user  = User.create({
email : 'dog@lclark.edu',
vocalStudent: false,
theoryStudent: false,
percussionStudent: false
})
module.exports = user;