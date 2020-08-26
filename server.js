require('dotenv').config();
const client = require('./lib/client');
const app = require('./lib/app')
const io = require('socket.io')();
client.connect();
const PORT = process.env.PORT || 7890;

app.listen(PORT, () => {
    console.log('server running on PORT', PORT);
});