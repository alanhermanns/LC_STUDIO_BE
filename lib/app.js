const app = express();
const User = require('./models/User');
const Time = require('./models/Time');
const Room = require('./models/Room');
// const Stats = require('../lib/models/Stats');
// const Session = require('../lib/models/Session');
const http = require('http').Server(app);
const io = require('socket.io')(http);
// const retrieveGlobalStat = require('./utils/retrieveGlobalStats');


app.use(express.json());

// app.get('/session-data/:id', (req, res, next) => {
//   const sessionId = req.params.id;
//   GlobalData
//     .find({ sessionId })
//     .then(sessionData => {
//       return sessionData.map(session => (
//         [session.diameter, session.circumference]
//       ));
//     })
//     .then(sessionsForCsv => res.send(sessionsForCsv))
//     .catch(next);
// });



io.on('connection', (socket) => {

  socket.on('NEW_TAKEN_TIME', ({ payload }) => {
    Time.postToAllTakenTimes(socket, payload)
      .then(data => {
        return Times.createStat(data, 'global')
          .then(globalData => {
            socket.emit('RETRIEVE_GLOBAL_STATS', globalData);
            socket.broadcast.emit('RETRIEVE_GLOBAL_STATS', globalData);
          });
      });
  });

  socket.on('NEW_SESSION_DATA', ({ payload, sessionId }) => {
    GlobalData.postToGlobal(socket, { ...payload, sessionId })
      .then(data => {
        return Promise.all([
          Stats.createStat(data, sessionId),
          Stats.createStat(data, 'global'),
          data
        ])
          .then(([sessionData, globalData, data]) => {
            socket.emit('RETRIEVE_GLOBAL_STATS', globalData);
            socket.broadcast.emit('RETRIEVE_GLOBAL_STATS', globalData);
            io.to(sessionId).emit('RETRIEVE_SESSION_STATS', sessionData);
            io.to(sessionId).emit('RETRIEVE_SESSION_DATA', data);
          });
      });
  });

  socket.on('JOIN_SESSION', (sessionId) => {
    socket.join(sessionId);
    retrieveGlobalStat(Stats, sessionId)
      .then(data => {
        socket.emit('RETRIEVE_SESSION_STATS', data);
      });
    
    GlobalData.find({ sessionId })
      .then(dataPoints => {
        socket.emit('RETRIEVE_SESSION_DATA', dataPoints);
      });
  });

  socket.on('GET_SESSION_DATA', (sessionId) => {
    GlobalData
      .find({ sessionId })
      .then(dataPoints => {
        socket.emit('GET_SESSION_DATA', dataPoints);
      });
  });

  socket.on('GET_SESSION_STATS', (sessionId) => {
    Stats
      .findOne({ sessionId }).sort({ count: -1 })
      .then(stat => {
        socket.emit('GET_SESSION_STATS', stat);
      });
  });

  socket.on('RETRIEVE_DATA_POINTS', () => {
    GlobalData.find()
      .then(points => {
        socket.broadcast.emit('RETRIEVE_DATA_POINTS', points);
        socket.emit('RETRIEVE_DATA_POINTS', points);
      });
  });

  socket.on('CREATE_SESSION', (payload) => {
    Session
      .create(payload)
      .then(session => {
        socket.emit('RETRIEVE_NEW_SESSION', session);
      });
  });

  socket.on('USER_LOGIN', ({ teacherId }) => {
    Session
      .find({ teacherId })
      .then(sessions => {
        socket.emit('USER_SESSIONS', sessions);
      });
  });

  socket.on('RETRIEVE_GLOBAL_STATS', () => {
    retrieveGlobalStat(Stats, 'global')
      .then(stats => {
        socket.emit('RETRIEVE_GLOBAL_STATS', stats);
      });
  });

  socket.on('RETRIEVE_SESSIONS', (teacherId) => {
    Session
      .find({ teacherId })
      .then(sessions => {
        socket.emit('RETRIEVE_SESSIONS', sessions);
      });
  });
});

app.use(require('./middleware/not-found'));
app.use(require('./middleware/error'));

module.exports = http;