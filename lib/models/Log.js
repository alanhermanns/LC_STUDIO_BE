const mongoose = require('mongoose')
const User = require('./User');

const schema = new mongoose.Schema({
    date: {
      type: Date, 
      required: true, 
    },
    roomName : {
      type : [String],
      required: true
    },
    email : {
        type: String,
        required: true
    }
  });

  schema.statics.enterIntoLogs = async function(newTakenTime){
    const userEmail = newTakenTime.email;
    const roomName = newTakenTime.roomName;
    const date = new Date(Date.now());
    return this
      .create({
          date : date,
          roomName : roomName,
          email: userEmail
      })
      .then(data => {
        return data;
      });
  };

  module.exports = mongoose.model('Log', schema);