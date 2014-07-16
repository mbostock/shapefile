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

        // Return the fragment if it exactly satisifies the pop.
        if (length === bufferFragment.length) {
          data = bufferFragment;
          bufferFragment = null;
        }

        // Return part of the fragment if it satisifies the pop.
        else if (length < bufferFragment.length) {
          data = bufferFragment.slice(0, length);
          bufferFragment = bufferFragment.slice(length);
        }

        // Otherwise, return the fragment and part of the buffer.
        else {
          bufferOffset = length - bufferFragment.length;
          data = Buffer.concat([bufferFragment, buffer.slice(0, bufferOffset)]);
          bufferFragment = null;
        }
      }

      // Otherwise, in the common case, return part of the buffer.
      else data = buffer.slice(bufferOffset, bufferOffset += length);

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
