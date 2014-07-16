module.exports = function() {
  var parser = {
        push: parser_push,
        pop: parser_pop
      },
      buffer = empty,
      bufferOffset = 0,
      bufferLength = 0,
      bufferFragment = null;

  function parser_push(data) {
    if (buffer !== empty) throw new Error("cannot push before all lines are popped");
    bufferLength += data.length;
    bufferOffset = 0;
    buffer = data;
  }

  function parser_pop(length) {
    if ((length |= 0) < 0) throw new Error("invalid length: " + length);
    var data;

    // If this pop can be satistified with the existing data,
    if (length <= bufferLength) {

      // And if there’s a fragment from the previous buffer,
      if (bufferFragment) {

        // And if this pop can be exactly satisified by the fragment,
        if (length === bufferFragment.length) {
          data = bufferFragment;
          bufferFragment = null;
        }

        // Or if the pop can be satisifed by a subset of the fragment,
        else if (length < bufferFragment.length) {
          data = bufferFragment.slice(0, length);
          bufferFragment = bufferFragment.slice(length);
        }

        // Otherwise, concatenate the fragment with a chunk from the buffer.
        else {
          bufferOffset = length - bufferFragment.length;
          data = Buffer.concat([bufferFragment, buffer.slice(0, bufferOffset)]);
          bufferFragment = null;
        }
      }

      // Otherwise, return a chunk from the buffer.
      else {
        data = buffer.slice(bufferOffset, bufferOffset += length);
      }

      bufferLength -= length;
      return data;
    }

    // This pop could not be satisified, so copy the remaining buffer and fragment.
    // (A copy is required, since the data could subsequently be modified.)
    bufferFragment = Buffer.concat([bufferFragment || empty, buffer.slice(bufferOffset)]);
    buffer = empty;
    bufferOffset = 0;
    return null;
  }

  return parser;
};

var empty = new Buffer(0);
