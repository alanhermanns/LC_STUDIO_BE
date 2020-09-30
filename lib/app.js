const express = require('express');
const app = express();
const User = require('./models/User');
const Time = require('./models/Time');
const Room = require('./models/Room');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const login = require('./utils/login');
const Log = require('./models/Log');
const {validatePassword} = require('./utils/admin')


app.use(express.json());


io.on('connection', (socket) => {

  socket.on('LOGIN_USER', ({payload}) => {
    console.log(payload)
    try{
      login(payload.email)
      .then(async(user) => {
          console.log(user)
          User.findById(user._id).populate('myTimes')
          .then((newUser) => {
            console.log('!', newUser);
            socket.emit('LOGGED_IN_USER', newUser);
          })
          return user;
      })
  }
  catch (err) {
      console.log(err);
      socket.error(err, 'NONONO');
      // res.status(500).json({
      //     error: err.message || err
      // });
   }
  })

  socket.on('DELETE_TIME', ({ payload }) => {
    console.log('DELETE payload', payload)

    return Time.findOneAndDelete({time : payload.time, roomName : payload.roomName})
    .then((deletedTime) => {
      return User.findOne({email: payload.email})
        .then((user) => {
          user.deleteFromMyTimeIds(socket, deletedTime)
          return user;
          })
          .then((user) => {
            User.findById(user._id).populate('myTimes')
              .then((newUser) => {
                socket.emit('LOGGED_IN_USER', newUser)
               })
               .then(() => {
                 Time.find({})
                  .then((times) => {
                    socket.broadcast.emit('UPDATE_ALL_TAKEN_TIMES', times);
                    socket.emit('UPDATE_ALL_TAKEN_TIMES', times);
                    return times;
                  })
               })
              return user;
            })
        })
  })

  socket.on('NEW_TIME', ({ payload }) => {
    console.log('payload', payload)
    Log.enterIntoLogs(payload)
    .then(() => {
      Time.enterIntoTakenTimes(socket, payload)
      .then(() => {
        console.log('EMAIL', payload.email)
        return Time.findOne({time : payload.time, roomName : payload.roomName})
        .then((time) => {
          return User.findOne({email : payload.email})
          .then((user) => {
            console.log('USER', user, 'TIME', time)
            user.addToMyTimeIds(socket, time)
            .then((user) => {
              User.findById(user._id).populate('myTimes')
              .then((newUser) => {
                socket.emit('LOGGED_IN_USER', newUser)
              })      
              return user;
            })
          })
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

// socket.on('RETRIEVE_TODAYS_LOGS', ({payload}) => {
//   let today = new Date(Date.now());
//   today = today.getTime() - 25200000;
//     today = new Date(today);
//     today = today.toISOString();
//   let sevenOClockTommorow = new Date()
//   sevenOClockTommorow = sevenOClockTommorow.setDate(sevenOClockTommorow + 1);
//   sevenOClockTommorow = sevenOClockTommorow.setHours(07)
  // Log.find({})
  //   .then((logs) => {
  //     let todayLogs = logs.map(log => {
  //       if(log.date.getDay() === today.getDay() || log.date.getDay() <= sevenOClockTommorow.getDay() && log.date.getHours() <= sevenOClockTommorow.getUTCHours()){
  //         return log
  //       }
  //     })
  //     return todayLogs
  //   })
  //   .then((todayLogs) => {
  //     console.log('logs return')
  //       socket.broadcast.emit('UPDATE_TODAY_LOGS', todayLogs);
  //       socket.emit('UPDATE_TODAY_LOGS', todayLogs);
  //       return todayLogs;
  //   })
// })

socket.on('RETRIEVE_TODAY_USERTIMES_ADMIN', ({payload}) => {
  try{ 
    validatePassword(payload.hash)
    .then(() => {
    Promise.all([Time.find({}), User.find({})])
    .then((times, users) => {
       let usersWithTimes = users.map(user => {
         if(user.myTimeIds.length > 1) return user
       })
       let timesWithUsers = times.map(time => {
           return usersWithTimes.map(user => {
                if(user.myTimeIds.includes(time.id)){
                    return {
                        email : user.email,
                        time : time.time,
                        roomeName : time.roomName[0]
                    }
                }
                else return
            })
        })
      return timesWithUsers;
    })
    .then(timesWithUsers => {
        console.log(timesWithUsers)
        // socket.broadcast.emit('UPDATE_TODAY_USERTIMES_ADMIN', todayLogs);
        socket.emit('UPDATE_TODAY_USERTIMES_ADMIN', timesWithUsers);
    })
  })
}
  catch(err){
    socket.emit(err)
  }
  })
})

app.use(require('./middleware/not-found'));
app.use(require('./middleware/error'));

module.exports = http;