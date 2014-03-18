var file = require("./file"),
    queue = require("queue-async");

exports.read = require("./read")(reader);
exports.reader = reader;

function reader(filename) {
  var fileReader = file.reader(filename),
      shapeType;

  function readHeader(callback) {
    fileReader.read(100, function(error, fileHeader) {
      if (fileHeader === end) error = new Error("unexpected EOF");
      if (error) return void callback(error);
      callback(null, {
        fileCode: fileHeader.readInt32BE(0), // TODO verify 9994
        version: fileHeader.readInt32LE(28), // TODO verify 1000
        shapeType: shapeType = fileHeader.readInt32LE(32),
        box: [fileHeader.readDoubleLE(36), fileHeader.readDoubleLE(44), fileHeader.readDoubleLE(52), fileHeader.readDoubleLE(60)]
        // TODO zMin: fileHeader.readDoubleLE(68)
        // TODO zMax: fileHeader.readDoubleLE(76)
        // TODO mMin: fileHeader.readDoubleLE(84)
        // TODO mMax: fileHeader.readDoubleLE(92)
      });
    });
    return this;
  }

  function readRecord(callback) {
    if (!shapeType) return callback(new Error("must read header before reading records")), this;
    if (!(shapeType in readShape)) return callback(new Error("unsupported shape type: " + shapeType)), this;
    var readShapeType = readShape[shapeType];
    fileReader.read(8, function readRecordHeader(error, recordHeader) {
      if (recordHeader === end) return callback(null, end);
      if (error) return void callback(error);
      // TODO verify var recordNumber = recordHeader.readInt32BE(0);
      fileReader.read(recordHeader.readInt32BE(4) * 2, function readRecord(error, record) {
        if (record === end) error = new Error("unexpected EOF");
        if (error) return void callback(error);
        var shapeType = record.readInt32LE(0);
        callback(null, shapeType ? readShapeType(record) : null);
      });
    });
    return this;
  }

  function close(callback) {
    fileReader.close(callback);
    return this;
  }

  return {
    readHeader: readHeader,
    readRecord: readRecord,
    close: close
  };
}

var end = exports.end = file.end;

var readShape = {
  0: readNull,
  1: readPoint,
  3: readPoly(3), // PolyLine
  5: readPoly(5), // Polygon
  8: readMultiPoint,
  11: readPointZ, // PointZ
  13: readPoly(3), // PolyLineZ
  15: readPoly(5), // PolygonZ
  18: readMultiPointZ, // MultiPointZ
  21: readPointM, // PointM
  // 23: TODO readPolyLineM
  // 25: TODO readPolygonM
  28: readMultiPointM // MultiPointM
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

function readPointZ(record) {
  var x = record.readDoubleLE(4),
      y = record.readDoubleLE(12),
      z = record.readDoubleLE(20),
      m = record.readDoubleLE(28);
  return {
    shapeType: 11,
    x: x,
    y: y,
    z: z,
    m: m
  };
}

function readPointM(record) {
  var x = record.readDoubleLE(4),
      y = record.readDoubleLE(12),
      m = record.readDoubleLE(20);
  return {
    shapeType: 21,
    x: x,
    y: y,
    m: m
  };
}

function readPoly(shapeType) {
  return function(record) {
    var box = [record.readDoubleLE(4), record.readDoubleLE(12), record.readDoubleLE(20), record.readDoubleLE(28)],
        numParts = record.readInt32LE(36),
        numPoints = record.readInt32LE(40),
        parts = new Array(numParts),
        points = new Array(numPoints),
        i = 44,
        j;
    for (j = 0; j < numParts; ++j, i += 4) parts[j] = record.readInt32LE(i);
    for (j = 0; j < numPoints; ++j, i += 16) points[j] = [record.readDoubleLE(i), record.readDoubleLE(i + 8)];
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
      points = new Array(numPoints),
      i = 40,
      j;
  for (j = 0; j < numPoints; ++j, i += 16) points[j] = [record.readDoubleLE(i), record.readDoubleLE(i + 8)];
  return {
    shapeType: 8,
    box: box,
    points: points
  };
}

function readMultiPointM(record) {
  var box = [record.readDoubleLE(4), record.readDoubleLE(12), record.readDoubleLE(20), record.readDoubleLE(28)],
      numPoints = record.readInt32LE(36),
      points = new Array(numPoints),
      i = 40,
      j,
      mMin = record.readDoubleLE(40+(16*numPoints)),
      mMax = record.readDoubleLE(40+(16*numPoints)+8),
      x = (40+(16*numPoints)+16),
      measures = new Array(numPoints);
  for (j = 0; j < numPoints; ++j, i += 16, x += 8) {
    points[j] = [record.readDoubleLE(i), record.readDoubleLE(i + 8)];
    measures[j] = record.readDoubleLE(x);
  }
  
  return {
    shapeType: 28,
    box: box,
    points: points,
    mRange: [mMin,mMax],
    measures: measures
  };
}

function readMultiPointZ(record) {
  var box = [record.readDoubleLE(4), record.readDoubleLE(12), record.readDoubleLE(20), record.readDoubleLE(28)],
      numPoints = record.readInt32LE(36),
      points = new Array(numPoints),
      i = 40,
      j,
      mMin = record.readDoubleLE(40+(16*numPoints)),
      mMax = record.readDoubleLE(40+(16*numPoints)+8),
      x = (40+(16*numPoints)+16),
      measures = new Array(numPoints);
      zMin = record.readDoubleLE(x+(8*numPoints)),
      zMax = record.readDoubleLE(x+(8*numPoints)+8),
      y = (x+(8*numPoints)+16),
      zVals = new Array(numPoints);
  for (j = 0; j < numPoints; ++j, i += 16, x += 8, y += 8) {
    points[j] = [record.readDoubleLE(i), record.readDoubleLE(i + 8)];
    measures[j] = record.readDoubleLE(x);
    zVals[j] = record.readDoubleLE(y);
  }
  
  return {
    shapeType: 18,
    box: box,
    points: points,
    mRange: [mMin,mMax],
    measures: measures,
    zRange: [zMin,zMax],
    zVals: zVals
  };
}