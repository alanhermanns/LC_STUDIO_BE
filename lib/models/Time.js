const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    time: {
      type: Number, 
      required: true, 
    },
    roomId : {
      type : [mongoose.Schema.Types.ObjectId],
      required: true
    }
  });

  schema.virtual('Room', {
    ref : 'Room',
    localField: roomId,
    foreignField: __id
  })

  schema.statics.postToAllTakenTimes = function(socket, newTakenTime){
    return this
      .create(newTakenTime)
      .then(data => {
        socket.broadcast.emit('UPDATE_ALL_TAKEN_TIMES', data);
        socket.emit('UPDATE_ALL_TAKEN_TIMES', data);
        return data;
      });
  };

  module.exports = mongoose.model('Time', schema);