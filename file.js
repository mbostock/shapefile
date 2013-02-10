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

  // TODO data and end probably shouldn't be exposed to clients
  fs.createReadStream(filename)
      .on("data", data)
      .on("end", end)
      .on("error", error);

  function maybeRead() {
    if (bytesAvailable >= bytesNeeded) {
      var buffer = consume(bytesNeeded);
      bytesAvailable -= bytesNeeded;
      bytesNeeded = undefined;
      read.call(emitter, buffer);
    }
  }

  function consume(bytes) {
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
    maybeRead();
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
    process.nextTick(maybeRead);
  };

  return emitter;
};
