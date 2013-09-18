module.exports = function(stream) {
  var bufferSize = 16 * 1024,
      bufferIndex = 0,
      buffer = new Buffer(bufferSize);

  function flush() {
    if (bufferIndex) {
      stream.write(buffer.slice(0, bufferIndex));
      buffer = new Buffer(bufferSize);
      bufferIndex = 0;
    }
  }

  return function(chunk) {
    if (chunk == null) return void flush();
    bufferIndex += buffer.write(chunk, bufferIndex);
    while (Buffer._charsWritten < chunk.length) {
      flush();
      bufferIndex = buffer.write(chunk = chunk.substring(Buffer._charsWritten));
    }
  };
};
