var file = require("./file");

exports.readStream = function(filename) {
  var stream = file.readStream(filename),
      read = stream.read,
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
    read(headerBytes, readFields);
  }

  function readFields(fields) {
    var n = 0;
    while (fields.readUInt8(n) != 0x0d) {
      var fieldName = fields.toString("ascii", n, n + 11).replace(/\0/g, ""),
          fieldType = fields.toString("ascii", n + 11, n + 12),
          fieldLength = fields.readUInt8(16),
          fieldCount = fields.readUInt8(17);
      stream.emit("fielddescriptor", {
        fieldName: fieldName,
        fieldType: fieldType,
        fieldLength: fieldLength,
        fieldCount: fieldCount
      });
      n += 32;
    }
    read(recordBytes, readRecord);
  }

  function readRecord(record) {
    stream.emit("record", record.toString("ascii"));
    read(recordBytes, readRecord);
  }

  return stream;
};
