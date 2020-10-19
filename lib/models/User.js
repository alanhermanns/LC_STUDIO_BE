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
}, {
  toJSON : {virtuals: true},
  toObject : {virtuals: true}
});

schema.virtual('myTimes', {
    ref: 'Time',
    localField: 'myTimeIds',
    foreignField: '_id',
    applysetters : true
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
      myTimeIds : tokenPayload.myTimeIds,
      myTimes: tokenPayload.myTimes,
      __v : tokenPayload.__v,
    }));
  }
  catch(err) {
    return "Bad Email";
  }
};

schema.methods.deleteFromMyTimeIds = async function(socket, time) {
  this.myTimeIds = this.myTimeIds.map((currentTimeId) => {
    if(currentTimeId === time._id) return
    else return currentTimeId
  })
  socket.emit('LOGGED_IN_USER', this)
  return await this.save();
}

schema.methods.addToMyTimeIds = async function(socket, time) {
  this.myTimeIds.push(time._id);
  socket.emit('LOGGED_IN_USER', this)
  return await this.save();
}

schema.methods.authToken = function() {
  return jwt.sign(this.toJSON(), process.env.APP_SECRET, {
    expiresIn: '72h'
  });
};

schema.statics.authorize = async function(email) {
  try{
  const user = await this.findOne({email : email});
  if(!user) {
    console.log('HERE')
    const err = new Error('Invalid Email');
    err.status = 401;
    throw err;
  }
  return user;
}
catch(err){
  return err
}
};


module.exports = mongoose.model('User', schema);