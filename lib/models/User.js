const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const schema = new mongoose.Schema({
  email: {
    type: String, 
    required: true, 
    unique: [true, 'Email is taken']
  },
  vocalStudent: {
      type: Boolean,
      required: true
  },
  theoryStudent: {
    type: Boolean,
    required: true
  },
  percussionStudent: {
    type: Boolean,
    required: true
  },
  myTimeIds: {
     type: [mongoose.Schema.Types.ObjectId],
     required: false
  }
});

schema.virtual('myTimes', {
    ref: 'Time',
    localField: 'myTimeIds',
    foreignField: '__id'
})

schema.statics.findByAuthToken = function(token) {
  try {
    const tokenPayload = jwt.verify(token, process.env.APP_SECRET);
    return Promise.resolve(this.hydrate({
      _id: tokenPayload._id,
      email: tokenPayload.email,
      vocalStudent: tokenPayload.vocalStudent,
      theoryStudent: tokenPayload.theoryStudent,
      percussionStudent: tokenPayload.percussionStudent,
      __v : tokenPayload.__v,
    }));
  }
  catch(err) {
    return Promise.reject(err);
  }
};

schema.methods.addToMyTimeIds = async function(socket, time) {
  this.myTimeIds.push(time._id);
  console.log('!!!!!!!!!!!!!!!', this.myTimeIds)
  socket.emit('LOGGED_IN_USER', this)
  await this.save();
}

schema.methods.authToken = function() {
  return jwt.sign(this.toJSON(), process.env.APP_SECRET, {
    expiresIn: '72h'
  });
};

schema.statics.authorize = async function(email) {

  const user = await this.findOne({email : email});
  if(!user) {
    const err = new Error('Invalid Email');
    err.status = 401;
    throw err;
  }
  return user;
};


module.exports = mongoose.model('User', schema);