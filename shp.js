var file = require("./file");

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
  11: readPoint, // PointZ
  13: readPoly(3), // PolyLineZ
  15: readPoly(5), // PolygonZ
  18: readMultiPoint, // MultiPointZ
  21: readPointM, // Measured Point
  23: readPolyM(23), // Measured PolyLine
  25: readPolyM(25), // Measured Polygon
  28: readMultiPointM // Measured MultiPoint
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

function readMeasures(record, numPoints, offset) {
  var mrange = new Array(2),
    measures = new Array(numPoints);

  mrange[0] = record.readDoubleLE(offset);
  mrange[1] = record.readDoubleLE(offset + 8);
  offset += 16;
  for (j = 0; j < numPoints; ++j, offset += 8) {
    measures[j] = record.readDoubleLE(offset);
  }

  return {
    mrange: mrange,
    measures: measures
  };
}

function readInitialPoly(record) {
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
    box: box,
    parts: parts,
    points: points,
    offset: i
  };
}

function readPoly(shapeType) {
  return function(record) {
    var poly = readInitialPoly(record);
    return {
      shapeType: shapeType,
      box: poly.box,
      parts: poly.parts,
      points: poly.points
    };
  };
}

function readPolyM(shapeType) {
  return function(record) {
    var poly = readInitialPoly(record);
    var measure = readMeasures(record, poly.points.length, poly.offset);

    return {
      shapeType: shapeType,
      box: poly.box,
      parts: poly.parts,
      points: poly.points,
      mrange: measure.mrange,
      measures: measure.measures
    };
  };
}

function readInitialMultiPoint(record) {
  var box = [record.readDoubleLE(4), record.readDoubleLE(12), record.readDoubleLE(20), record.readDoubleLE(28)],
    numPoints = record.readInt32LE(36),
    points = new Array(numPoints),
    i = 40,
    j;
  for (j = 0; j < numPoints; ++j, i += 16) {
    points[j] = [record.readDoubleLE(i), record.readDoubleLE(i + 8)];
  }
  return {
    box: box,
    points: points,
    offset: i
  };
}

function readMultiPoint(record) {
  var multiPoint = readInitialMultiPoint(record);
  return {
    shapeType: 8,
    box: multiPoint.box,
    points: multiPoint.points
  };
}

function readMultiPointM(record) {
  var multiPoint = readInitialMultiPoint(record);
  var measures = readMeasures(record, multiPoint.points.length, multiPoint.offset);
  return {
    shapeType: 28,
    box: multiPoint.box,
    points: multiPoint.points,
    measures: measures.measures,
    mrange: measures.mrange
  };
}