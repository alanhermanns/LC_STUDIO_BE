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
        User.findOneAndUpdate({email : payload.email}, {myTimeIds : [...myTimeIds, payload.time]},{
          new : true
        })
      })
    .then(() => console.log('done'))
  });
});

app.use(require('./middleware/not-found'));
app.use(require('./middleware/error'));

module.exports = http;