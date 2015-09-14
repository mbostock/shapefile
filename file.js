var fs = require("fs");

exports.reader = function(filename) {
  var stream;
  if (typeof filename === 'string') {
    stream = fs.createReadStream(filename);
  } else {
    stream = filename;
  }
  var ended = false;
  var error = false;
  var reading = false;
  var waiting = false;
  stream.on('error', function (err) {
    error = err;
    if (waiting) {
      var temp = waiting;
      waiting = false;
      temp[1](err);
    }
    waiting = false;
  }).on('end', function () {
    ended = true;
    if (waiting) {
      var temp = waiting;
      waiting = false;
      temp[1](null, end);
    }
  }).on('readable', function () {
    reading = true;
    if (waiting) {
      var temp = waiting;
      waiting = false;
      var out = stream.read(temp[0]);
      if (out) {
        temp[1](null, out);
      } else {
        waiting = temp;
        reading = false;
      }
    }
  });
  return {
    read: function read(bytes, callback) {
      if (error) return callback(error), this;
      if (ended) return callback(null, end), this;
      if (reading) {
        var out = stream.read(bytes);
        if (out) {
          callback(null, out);
          return this;
        }
        reading = false;
      }
      waiting = [bytes, callback];

      return this;
    },
    close: function close(callback) {
      ended = true;
      stream.removeAllListeners();
      if (error) return callback(error), this;
      process.nextTick(callback);
      return this;
    }
  };
};

var end = exports.end = {};

function noop() {}
