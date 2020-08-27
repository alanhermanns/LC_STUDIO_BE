const express = require('express');
const app = express();
const User = require('./models/User');
const Time = require('./models/Time');
const Room = require('./models/Room');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const login = require('./utils/login')


app.use(express.json());


io.on('connection', (socket) => {

  socket.on('LOGIN_USER', ({payload}) => {
    console.log(payload)
    try {
      login(payload.email)
      .then((user) => {
        socket.emit('LOGGED_IN_USER', user);
        console.log('!', user);
        return user;
      })
  }
  catch (err) {
      console.log(err);
      res.status(500).json({
          error: err.message || err
      });
  }
  })
//payload : room name, time, useremail
//need useeffect to grab all times on load
  socket.on('NEW_TIME', ({ payload }) => {
    console.log('payload', payload)
    Time.enterIntoTakenTimes(socket, payload)
      .then(() => {
        console.log('EMAIL', payload.email)
        return Time.findOne({time : payload.time})
        .then((time) => {
          return User.findOne({email : payload.email})
          .then((user) => {
            console.log('USER', user, 'TIME', time)
            user.addToMyTimeIds(socket, time);
          })
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
        console.log('here in app', poppedTimes)
        socket.broadcast.emit('UPDATE_ALL_TAKEN_TIMES', poppedTimes);
        socket.emit('UPDATE_ALL_TAKEN_TIMES', poppedTimes);
        return poppedTimes;
      })
    })
  });

  socket.on('RETRIEVE_TIMES', ({payload}) => {
    Time.find({})
      .then((times) => {
        const arrOfPopulatedTimes = times.map(time => {
          return time.populate('Room', {virtuals : true})
        })
        return arrOfPopulatedTimes;
      })
      .then((poppedTimes) => {
        console.log('here in app', poppedTimes)
        socket.broadcast.emit('UPDATE_ALL_TAKEN_TIMES', poppedTimes);
        socket.emit('UPDATE_ALL_TAKEN_TIMES', poppedTimes);
        return poppedTimes;
      })
    })
});

app.use(require('./middleware/not-found'));
app.use(require('./middleware/error'));

module.exports = http;