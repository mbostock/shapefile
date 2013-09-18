var iconv = require("iconv-lite"),
    reader = require("./reader");

exports.read = function(stream, encoding, sink) {
  var read = reader(stream),
      decode = utf8.test(encoding) ? decodeUtf8 : decoder(encoding || "ISO-8859-1"),
      fileType,
      fileDate,
      fieldDescriptors = [],
      recordCount,
      recordBytes,
      started = false,
      paused = false;

  sink.pause = function() { paused = true; };
  sink.resume = function() { paused = false; if (started) readNextRecord(); };

  read(32, readFileHeader);

  function readFileHeader(fileHeader) {
    if (!fileHeader) return void stream.close();
    fileType = fileHeader.readUInt8(0); // TODO verify 3
    fileDate = new Date(1900 + fileHeader.readUInt8(1), fileHeader.readUInt8(2) - 1, fileHeader.readUInt8(3));
    recordCount = fileHeader.readUInt32LE(4);
    recordBytes = fileHeader.readUInt16LE(10);
    read(fileHeader.readUInt16LE(8) - 32, readFields);
  }

  function readFields(fields) {
    if (!fields) return void stream.close();
    var n = 0;
    while (fields.readUInt8(n) != 0x0d) {
      fieldDescriptors.push({
        name: fieldName(decode(fields, n, n + 11)),
        type: fields.toString("ascii", n + 11, n + 12),
        length: fields.readUInt8(n + 16)
      });
      n += 32;
    }
    started = true;
    sink.geometryStart();
    if (!paused) readNextRecord();
  }

  function readNextRecord() {
    read(recordBytes, readRecord);
  }

  function readRecord(record) {
    if (!record) return void close();
    var i = 1;
    sink.geometryStart();
    fieldDescriptors.forEach(function(field) {
      sink.property(field.name, fieldTypes[field.type](decode(record, i, i += field.length)));
    });
    sink.geometryEnd();
    if (!paused) readNextRecord();
  }

  function close() {
    sink.geometryEnd();
    if (stream.close) stream.close();
  }
};

var utf8 = /^utf[-]?8$/i;

function decoder(encoding) {
  return function(buffer, i, j) {
    return iconv.decode(buffer.slice(i, j), encoding);
  };
}

function decodeUtf8(buffer, i, j) {
  return buffer.toString("utf8", i, j);
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
