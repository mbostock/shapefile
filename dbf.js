var file = require("./file");

exports.readStream = function(filename) {
  var stream = file.readStream(filename),
      read = stream.read,
      fileType,
      fileDate,
      fieldDescriptors = [],
      recordCount,
      recordBytes;

  delete stream.read;

  read(32, readFileHeader);

  function readFileHeader(fileHeader) {
    fileType = fileHeader.readUInt8(0); // TODO verify 3
    fileDate = new Date(1900 + fileHeader.readUInt8(1), fileHeader.readUInt8(2) - 1, fileHeader.readUInt8(3));
    recordCount = fileHeader.readUInt32LE(4);
    recordBytes = fileHeader.readUInt16LE(10);
    read(fileHeader.readUInt16LE(8) - 32, readFields);
  }

  function readFields(fields) {
    var n = 0;
    while (fields.readUInt8(n) != 0x0d) {
      fieldDescriptors.push({
        name: fieldName(fields.toString("ascii", n, n + 11)),
        type: fields.toString("ascii", n + 11, n + 12),
        length: fields.readUInt8(n + 16)
      });
      n += 32;
    }
    stream.emit("header", {
      version: fileType,
      date: fileDate,
      count: recordCount,
      fields: fieldDescriptors
    });
    read(recordBytes, readRecord);
  }

  function readRecord(record) {
    var i = 1;
    stream.emit("record", fieldDescriptors.map(function(field) {
      return fieldTypes[field.type](record.toString("ascii", i, i += field.length));
    }));
    read(recordBytes, readRecord);
  }

  return stream;
};

var fieldTypes = {
  B: fieldNumber,
  C: fieldString,
  D: fieldString,
  F: fieldNumber,
  L: fieldBoolean,
  M: fieldNumber,
  N: fieldNumber
};

function fieldNumber(d) {
  return +d;
}

function fieldString(d) {
  return d.trim();
}

function fieldBoolean(d) {
  return d === "T";
}

function fieldName(string) {
  var i = string.indexOf("\0");
  return i < 0 ? string : string.substring(0, i);
}
