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
          try{
          console.log(user)
          User.findById(user._id).populate('myTimes')
          .then((newUser) => {
            try{
            if(!newUser){
              socket.emit('ERROR', 'Not Vaild')
            }
            else{
            socket.emit('LOGGED_IN_USER', newUser);
            }
            }
            catch(err){
              console.log('ERROR EHE')
              return err;
            }
          })
          return user;
          }
          catch(err){
          return err
          }
      })
  }
  catch (err) {
      console.log(err);
      socket.emit('ERROR', err);
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
      console.log('here')
    Promise.all([Time.find({}), User.find({})])
    .then((values) => {
      let times = values[0]
      let users = values[1]
      let usersWithTimes = users.reduce((acc, curr) => {
        if(curr.myTimeIds.length > 1){
          acc.push(curr)
          return acc
        }
        else return acc
      }, [])
      console.log('USERS', usersWithTimes)
        let timesWithUsers = times.map(time => {
           return usersWithTimes.reduce((acc, curr) => {
                if(curr.myTimeIds.includes(time._id)){
                    acc.push({
                        email : curr.email,
                        time : time.time,
                        roomeName : time.roomName[0]
                    })
                    return acc
                }
                else return acc
            }, [])
        })
      return timesWithUsers;
    })
    .then(timesWithUsers => {
        let nonEmptyTimesWithUsers = timesWithUsers.reduce((acc, curr) => {
          if(curr[0]){
            acc.push(curr)
          }
          return acc
        },[])
        console.log(nonEmptyTimesWithUsers)
        // socket.broadcast.emit('UPDATE_TODAY_USERTIMES_ADMIN', todayLogs);
        socket.emit('UPDATE_TODAY_USERTIMES_ADMIN', nonEmptyTimesWithUsers);
    })
  })
}
  catch(err){
    socket.emit('ERROR', err)
  }
  })
})

app.use(require('./middleware/not-found'));
app.use(require('./middleware/error'));

module.exports = http;