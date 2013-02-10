var file = require("./file");

exports.readStream = function(filename) {
  var stream = file.readStream(filename),
      read = stream.read;

  delete stream.read;

  read(100, readFileHeader);

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
    stream.emit("fileheader", {
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
    read(8, readRecordHeader);
  }

  function readRecordHeader(recordHeader) {
    var recordNumber = recordHeader.readInt32BE(0),
        recordBytes = recordHeader.readInt32BE(4) * 2;
    stream.emit("recordheader", {
      recordNumber: recordNumber,
      recordBytes: recordBytes
    });
    read(recordBytes, readRecord);
  }

  function readRecord(record) {
    var shapeType = record.readInt32LE(0);
    stream.emit("record", readShape[shapeType](record));
    read(8, readRecordHeader);
  }

  return stream;
};

var readShape = {
  0: readNull,
  1: readPoint,
  3: readPoly(3), // PolyLine
  5: readPoly(5), // Polygon
  8: readMultiPoint
  // 11: TODO readPointZ
  // 13: TODO readPolyLineZ
  // 15: TODO readPolygonZ
  // 18: TODO readMultiPointZ
  // 21: TODO readPointM
  // 23: TODO readPolyLineM
  // 25: TODO readPolygonM
  // 28: TODO readMultiPointM
  // 31: TODO readMultiPatch
};

function readNull() {
  return null;
}

function readPoint(record) {
  var x = record.readDoubleLE(4),
      y = record.readDoubleLE(12);
  return {
    shapeType: 1,
    x: x,
    y: y
  };
}

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

function readMultiPoint(record) {
  var box = [record.readDoubleLE(4), record.readDoubleLE(12), record.readDoubleLE(20), record.readDoubleLE(28)],
      numPoints = record.readInt32LE(36),
      i = 40,
      points = [];
  while (numPoints-- > 0) points.push([record.readDoubleLE(i), record.readDoubleLE(i + 8)]), i += 16;
  return {
    shapeType: 8,
    box: box,
    points: points
  };
}
