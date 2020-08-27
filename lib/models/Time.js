const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    time: {
      type: Number, 
      required: true, 
    },
    roomName : {
      type : [String],
      required: true
    }
  });

  schema.virtual('Room', {
    ref : 'Room',
    localField: 'roomName',
    foreignField: 'name'
  })

  schema.statics.enterIntoTakenTimes = function(socket, newTakenTime){
    return this
      .create(newTakenTime)
      .then(data => {
        socket.broadcast.emit('UPDATE_USER_TAKEN_TIMES', data);
        socket.emit('UPDATE_USER_TAKEN_TIMES', data);
        return data;
      });
  };

  module.exports = mongoose.model('Time', schema);