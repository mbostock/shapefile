module.exports = function() {
  var parser = {
        push: parser_push,
        pop: parser_pop
      },
      buffer = new Buffer(0),
      bufferOffset = 0,
      bufferLength = 0,
      bufferFragment = null;

  function parser_push(data) {
    if (bufferOffset < bufferLength) throw new Error("cannot push before all lines are popped");
    if (bufferFragment) data = Buffer.concat([bufferFragment, data]), bufferFragment = null; // slow?
    bufferLength = data.length;
    bufferOffset = 0;
    buffer = data;
  }

  function parser_pop(length) {
    if (length <= bufferLength) return bufferLength -= length, buffer.slice(bufferOffset, bufferOffset += length);
    if (bufferLength <= 0) return null;
    var data = buffer.slice(bufferOffset);
    bufferOffset = bufferLength = 0;
    if (bufferFragment) bufferFragment = Buffer.concat([bufferFragment, data]); // slow? but rare
    else bufferFragment = data;
    return null;
  }

  return parser;
};
