var fs = require("fs"),
    events = require("events");

exports.readStream = function(filename) {
  var emitter = new events.EventEmitter(),
      read,
      bytesNeeded,
      bytesAvailable = 0,
      bytesChunk = 0,
      chunkHead,
      chunkTail;

  fs.createReadStream(filename)
      .on("data", data)
      .on("end", end)
      .on("error", error);

  function process(bytes) {
    if (bytesChunk + bytes <= chunkHead.length) {
      return chunkHead.slice(bytesChunk, bytesChunk += bytes);
    }

    var buffer = new Buffer(bytes),
        bytesCopied = chunkHead.length - bytesChunk;

    chunkHead.copy(buffer, 0, bytesChunk);
    chunkHead = chunkHead.next;
    bytesChunk = 0;

    while (bytes - bytesCopied > chunkHead.length) {
      chunkHead.copy(buffer, bytesCopied += chunkHead.length);
      chunkHead = chunkHead.next;
    }

    chunkHead.copy(buffer, bytesCopied, 0, bytesChunk = bytes - bytesCopied);
    return buffer;
  }

  function data(chunk) {
    if (chunkTail) chunkTail.next = chunk;
    if (!chunkHead) chunkHead = chunk;
    chunkTail = chunk;
    bytesAvailable += chunk.length;
    if (bytesAvailable >= bytesNeeded) {
      var buffer = process(bytesNeeded);
      bytesAvailable -= bytesNeeded;
      bytesNeeded = undefined;
      read.call(emitter, buffer);
    }
  }

  function error(e) {
    emitter.emit("error", e);
  }

  function end() {
    emitter.emit("end");
  }

  emitter.read = function(bytes, callback) {
    bytesNeeded = bytes;
    read = callback;
  };

  return emitter;
};
