const express = require('express');
const app = express();
const User = require('./models/User');
const Time = require('./models/Time');
const Room = require('./models/Room');
const http = require('http').Server(app);
const io = require('socket.io')(http);



app.use(express.json());


io.on('connection', (socket) => {
//payload : room name, time, useremail
  socket.on('NEW_TIME', ({ payload }) => {
    Time.enterIntoTakenTimes(socket, payload)
      .then(()=> {
        User.findOneAndUpdate({email : payload.email}, {'myTimeIds' : [payload.time]}, {
          new : true
        })
      })
    .then(() => {
      Time.find({})
      .then((times) => {
        const arrOfPopulatedTimes = times.map(time => {
          return time.populate('Room', {virtuals : true})
        })
        return arrOfPopulatedTimes;
      })
      .then((poppedTimes) => {
        socket.broadcast.emit('UPDATE_USER_TAKEN_TIMES', poppedTimes);
        socket.emit('UPDATE_USER_TAKEN_TIMES', poppedTimes);
        return poppedTimes;
      })
    })
  });
});

app.use(require('./middleware/not-found'));
app.use(require('./middleware/error'));

module.exports = http;