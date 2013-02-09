var events = require("events");

var file = require("./file");

exports.readStream = function(filename) {
  var emitter = new events.EventEmitter();

  var stream = file.readStream(filename)
      .on("error", function(e) { emitter.emit("error", e); })
      .on("end", function() { emitter.emit("end"); });

  stream.read(100, readFileHeader);

  function readFileHeader(fileHeader) {
    var fileCode = fileHeader.readInt32BE(0), // TODO verify 9994
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
    stream.read(8, readRecordHeader);
  }

  function readRecordHeader(recordHeader) {
    var recordNumber = recordHeader.readInt32BE(0),
        recordBytes = recordHeader.readInt32BE(4) * 2;
    emitter.emit("recordheader", {
      recordNumber: recordNumber,
      recordBytes: recordBytes
    });
    stream.read(recordBytes, readRecord);
  }

  function readRecord(record) {
    var shapeType = record.readInt32LE(0);
    emitter.emit("record", readShape[shapeType](record));
    stream.read(8, readRecordHeader);
  }

  return emitter;
};

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

// TODO
// exports.read = function(filename, callback) {};
