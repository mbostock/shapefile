var fs = require("fs"),
    events = require("events");

exports.readStream = function(filename) {
  var emitter = new events.EventEmitter(),
      read = readFileHeader,
      bytesAvailable = 0,
      bytesChunk = 0,
      chunkHead,
      chunkTail;

  fs.createReadStream(filename)
      .on("data", data)
      .on("end", end)
      .on("error", error);

  function readFileHeader() {
    if (bytesAvailable >= 100) {
      var fileHeader = process(100),
          fileCode = fileHeader.readInt32BE(0), // TODO verify 9994
          fileBytes = fileHeader.readInt32BE(24) * 2,
          version = fileHeader.readInt32LE(28), // TODO verify 1000
          shapeType = fileHeader.readInt32LE(32),
          xMin = fileHeader.readDoubleLE(36),
          yMin = fileHeader.readDoubleLE(44),
          xMax = fileHeader.readDoubleLE(52),
          yMax = fileHeader.readDoubleLE(60),
          zMin = fileHeader.readDoubleLE(68),
          yMax = fileHeader.readDoubleLE(76),
          mMin = fileHeader.readDoubleLE(84),
          mMax = fileHeader.readDoubleLE(92);
      emitter.emit("fileheader", {
        fileCode: fileCode,
        fileBytes: fileBytes,
        version: version,
        shapeType: shapeType,
        xMin: xMin,
        xMax: xMax,
        yMin: yMin,
        yMax: yMax,
        zMin: zMin,
        yMax: yMax,
        mMin: mMin,
        mMax: mMax
      });
      bytesAvailable = 0;
      read = readRecordHeader;
    }
  }

  function readRecordHeader() {
    if (bytesAvailable >= 8) {
      var recordHeader = process(8),
          recordNumber = recordHeader.readInt32BE(0),
          recordBytes = recordHeader.readInt32BE(4) * 2;
      emitter.emit("recordheader", {
        recordNumber: recordNumber,
        recordBytes: recordBytes
      });
      bytesAvailable = 0;
      read = readRecord(recordBytes);
    }
  }

  function readRecord(recordBytes) {
    return function() {
      if (bytesAvailable >= recordBytes) {
        var record = process(recordBytes),
            shapeType = record.readInt32LE(0);
        emitter.emit("record", readShape[shapeType](record));
        bytesAvailable = 0;
        read = readRecordHeader;
      }
    };
  }

  var readShape = {
    3: readPoly(3),
    5: readPoly(5)
  };

  function readPoly(shapeType) {
    return function(record) {
      var box = [record.readDoubleLE(4), record.readDoubleLE(12), record.readDoubleLE(20), record.readDoubleLE(28)],
          numParts = record.readInt32LE(36),
          numPoints = record.readInt32LE(40),
          i = 44,
          parts = [],
          points = [];
      while (numParts-- > 0) parts.push(record.readInt32LE(i)), i += 4;
      while (numPoints-- > 0) points.push([record.readDoubleLE(i), record.readDoubleLE(i + 8)]), i += 16;
      return {
        shapeType: shapeType,
        box: box,
        parts: parts,
        points: points
      };
    };
  }

  function process(bytes) {
    if (bytesChunk + bytes <= chunkHead.length) {
      return chunkHead.slice(bytesChunk, bytesChunk += bytes);
    }

    var buffer = new Buffer(bytes),
        bytesCopied = chunkHead.length - bytesChunk;

    chunkHead.copy(buffer, 0, bytesChunk);
    chunkHead = chunkHead.next;
    bytesChunk = 0;

    while (bytes - bytesCopied > chunkHead.length) {
      chunkHead.copy(buffer, bytesCopied += chunkHead.length);
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
    read();
  }

  function error(e) {
    emitter.emit("error", e);
  }

  function end() {
    emitter.emit("end");
  }

  return emitter;
};

// TODO
// exports.read = function(filename, callback) {};
