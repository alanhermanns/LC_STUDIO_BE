const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name: {
      type: String, 
      required: true, 
    },
    vocal: {
        type: Boolean,
        required: true
    },
    theory: {
      type: Boolean,
      required: true
    },
    percussion: {
      type: Boolean,
      required: true
    }
  });

  module.exports = mongoose.model('Room', schema);