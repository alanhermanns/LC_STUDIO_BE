const mongoose = require('mongoose')
const User = require('./User');

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

  schema.statics.enterIntoTakenTimes = async function(socket, newTakenTime){
    const found =  await this.findOne({time : newTakenTime.time, roomName : newTakenTime.roomName});
    const user = await User.findOne({email : payload.email});
    if(!user || found) return
    else {
    return this
      .create(newTakenTime)
      .then(data => {
        console.log('here in time user static', data)
        socket.broadcast.emit('UPDATE_USER_TAKEN_TIMES', data);
        socket.emit('UPDATE_USER_TAKEN_TIMES', data);
        return data;
      }); 
    }
  };

  module.exports = mongoose.model('Time', schema);