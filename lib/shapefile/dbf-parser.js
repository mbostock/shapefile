var iconv = require("iconv-lite");

var STATES = 0,
    STATE_FILE_HEADER = ++STATES,
    STATE_FIELD_DESCRIPTORS = ++STATES,
    STATE_RECORD = ++STATES;

module.exports = function() {
  var parser = {
        push: parser_push,
        pop: parser_pop,
        encoding: parser_encoding
      },
      buffer = new Buffer(0),
      bufferOffset = 0,
      bufferLength = 0,
      bufferFragment = null,
      state = STATE_FILE_HEADER,
      encoding = "ISO-8859-1",
      decode = decoder(encoding),
      fields = [],
      fieldDescriptorsLength,
      recordLength;

  function parser_encoding(newEncoding) {
    if (!arguments.length) return encoding;
    if (bufferLength > 0) throw new Error("cannot change encoding after pushing data");
    if (!iconv.encodingExists(newEncoding = newEncoding + "")) throw new Error("unknown encoding: " + newEncoding);
    encoding = newEncoding;
    decode = decoder(encoding);
    return parser;
  }

  function parser_push(data) {
    if (bufferOffset < bufferLength) throw new Error("cannot push before all lines are popped");
    if (bufferFragment) data = Buffer.concat([bufferFragment, data]), bufferFragment = null; // slow?
    bufferLength = data.length;
    bufferOffset = 0;
    buffer = data;
  }

  function parser_pop() {
    while (true) {
      switch (state) {
        case STATE_FILE_HEADER: {
          var fileHeader;
          if ((fileHeader = read(32)) == null) return null;
          fieldDescriptorsLength = fileHeader.readUInt16LE(8) - 32;
          recordLength = fileHeader.readUInt16LE(10);
          state = STATE_FIELD_DESCRIPTORS;
          continue;
        }
        case STATE_FIELD_DESCRIPTORS: {
          var fieldDescriptors;
          if ((fieldDescriptors = read(fieldDescriptorsLength)) == null) return null;
          var n = 0;
          while (fieldDescriptors.readUInt8(n) != 0x0d) {
            fields.push({
              name: fieldName(decode(fieldDescriptors, n, n + 11)),
              type: fieldTypes[fieldDescriptors.toString("ascii", n + 11, n + 12)],
              length: fieldDescriptors.readUInt8(n + 16)
            });
            n += 32;
          }
          state = STATE_RECORD;
          continue;
        }
        case STATE_RECORD: {
          var record;
          if ((record = read(recordLength)) == null) return null;
          var properties = {};
          for (var i = 0, n = fields.length, j = 1, field; i < n; ++i) {
            field = fields[i];
            properties[field.name] = field.type(decode(record, j, j += field.length));
          }
          return properties;
        }
        default: throw new Error("unknown state: " + state);
      }
    }
  }

  function read(length) {
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

function decoder(encoding) {
  return Buffer.isEncoding(encoding) ? decodeNative(encoding) : function(buffer, i, j) {
    return iconv.decode(buffer.slice(i, j), encoding);
  };
}

function decodeNative(encoding) {
  return function(buffer, i, j) {
    return buffer.toString(encoding, i, j);
  };
}

var fieldTypes = {
  B: fieldNumber,
  C: fieldString,
  D: fieldDate,
  F: fieldNumber,
  L: fieldBoolean,
  M: fieldNumber,
  N: fieldNumber
};

function fieldNumber(d) {
  return isNaN(d = +d) ? null : d;
}

function fieldString(d) {
  return d.trim() || null;
}

function fieldDate(d) {
  return new Date(+d.substring(0, 4), d.substring(4, 6) - 1, +d.substring(6, 8));
}

function fieldBoolean(d) {
  return /^[nf]$/i.test(d) ? false
      : /^[yt]$/i.test(d) ? true
      : null;
}

function fieldName(string) {
  var i = string.indexOf("\0");
  return i < 0 ? string : string.substring(0, i);
}
