var nextTick = global.setImmediate || process.nextTick;

module.exports = function(stream) {
  var callback,
      readAll = false,
      bytesNeeded,
      bytesAvailable = 0,
      bytesChunk = 0,
      chunkHead,
      chunkTail;

  stream
      .on("data", data)
      .on("end", end)
      .on("error", error);

  function maybeRead() {
    if (bytesAvailable >= bytesNeeded) {
      var buffer = consume(bytesNeeded);
      bytesAvailable -= bytesNeeded;
      bytesNeeded = undefined;
      callback(buffer);
    }
  }

  function maybeEnd() {
    if (bytesAvailable < bytesNeeded) {
      bytesNeeded = undefined;
      callback(null);
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
      chunkHead.copy(buffer, bytesCopied);
      bytesCopied += chunkHead.length;
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

  function end() {
    readAll = true;
    nextTick(maybeEnd);
  }

  function error(error) {
    callback(null, error);
  }

  return function(bytes, _) {
    bytesNeeded = bytes;
    if (readAll && bytesAvailable < bytesNeeded) return void nextTick(maybeEnd);
    callback = _;
    nextTick(maybeRead);
  };
};
