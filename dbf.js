var file = require("./file");

exports.readStream = function(filename) {
  var stream = file.readStream(filename),
      read = stream.read,
      fieldDescriptors = [],
      recordBytes;

  delete stream.read;

  read(32, readFileHeader);

  function readFileHeader(fileHeader) {
    var fileType = fileHeader.readUInt8(0), // TODO verify 3
        year = 1900 + fileHeader.readUInt8(1),
        month = fileHeader.readUInt8(2),
        day = fileHeader.readUInt8(3),
        recordCount = fileHeader.readUInt32LE(4),
        headerBytes = fileHeader.readUInt16LE(8);
    recordBytes = fileHeader.readUInt16LE(10);
    stream.emit("fileheader", {
      fileType: fileType,
      year: year,
      month: month,
      day: day,
      recordCount: recordCount,
      headerBytes: headerBytes,
      recordBytes: recordBytes
    });
    read(headerBytes - 32, readFields);
  }

  function readFields(fields) {
    var n = 0;
    while (fields.readUInt8(n) != 0x0d) {
      var fieldName = cut(fields.toString("ascii", n, n + 11)),
          fieldType = fields.toString("ascii", n + 11, n + 12),
          fieldLength = fields.readUInt8(n + 16),
          fieldCount = fields.readUInt8(n + 17),
          field;
      fieldDescriptors.push(field = {
        fieldName: fieldName,
        fieldType: fieldType,
        fieldLength: fieldLength,
        fieldCount: fieldCount
      });
      stream.emit("fielddescriptor", field);
      n += 32;
    }
    read(recordBytes, readRecord);
  }

  function readRecord(record) {
    var i = 1;
    stream.emit("record", fieldDescriptors.map(function(field) {
      return fieldTypes[field.fieldType](record.toString("ascii", i, i += field.fieldLength));
    }));
    read(recordBytes, readRecord);
  }

  function cut(string) {
    var i = string.indexOf("\0");
    return i < 0 ? string : string.substring(0, i);
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
