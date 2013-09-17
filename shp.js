var fs = require("fs");

var reader = require("./reader");

exports.read = function(filename) {
  return function(sink) {
    var stream = fs.createReadStream(filename),
        read = reader(stream),
        shapeType,
        readShapeType;

    read(100, readFileHeader);

    function readFileHeader(fileHeader) {
      shapeType = fileHeader.readInt32LE(32);
      if (!(shapeType in readShape)) throw new Error("unsupported shape type: " + shapeType);
      sink.geometryStart();
      sink.bbox(
        fileHeader.readDoubleLE(36), // x0
        fileHeader.readDoubleLE(52), // x1
        fileHeader.readDoubleLE(44), // y0
        fileHeader.readDoubleLE(60)  // y1
      );
      readShapeType = readShape[shapeType];
      read(8, readRecordHeader);
    }

    function readRecordHeader(recordHeader) {
      if (!recordHeader) return void close();
      read(recordHeader.readInt32BE(4) * 2, function readRecord(record) {
        if (!record) return void close();
        sink.geometryStart();
        if (record.readInt32LE(0)) readShapeType(record, sink);
        sink.geometryEnd();
        read(8, readRecordHeader);
      });
    }

    function close() {
      sink.geometryEnd();
      stream.close();
    }
  };
};

var readShape = {
  1: readPoint,
  3: readPolyline, // PolyLine
  5: readPolygon, // Polygon
  8: readMultiPoint,
  11: readPoint, // PointZ
  13: readPolyline, // PolyLineZ
  15: readPolygon, // PolygonZ
  18: readMultiPoint // MultiPointZ
  // 21: TODO readPointM
  // 23: TODO readPolyLineM
  // 25: TODO readPolygonM
  // 28: TODO readMultiPointM
  // 31: TODO readMultiPatch
};

function readPoint(record, sink) {
  sink.point(record.readDoubleLE(4), record.readDoubleLE(12));
}

function readPolyline(record, sink) {
  var n = record.readInt32LE(36),
      m = record.readInt32LE(40);

  sink.bbox(
    record.readDoubleLE(4),  // x0
    record.readDoubleLE(20), // x1
    record.readDoubleLE(12), // y0
    record.readDoubleLE(28)  // y1
  );

  for (var i = 0, j = record.readInt32LE(44); i < n; ++i, j = k) {
    sink.lineStart();
    for (var k = i < n - 1 ? record.readInt32LE(44 + i * 4 + 4) : m; j < k; ++j) {
      sink.point(
        record.readDoubleLE(44 + n * 4 + j * 16),    // x
        record.readDoubleLE(44 + n * 4 + j * 16 + 8) // y
      );
    }
    sink.lineEnd();
  }
}

// TODO detect which rings are exteriors and which are interiors
function readPolygon(record, sink) {
  var n = record.readInt32LE(36),
      m = record.readInt32LE(40);

  sink.bbox(
    record.readDoubleLE(4),  // x0
    record.readDoubleLE(20), // x1
    record.readDoubleLE(12), // y0
    record.readDoubleLE(28)  // y1
  );

  for (var i = 0, j = 0; i < n; ++i, j = k + 1) {
    sink.polygonStart();
    sink.lineStart();
    for (var k = (i < n - 1 ? record.readInt32LE(44 + i * 4) : m) - 1; j < k; ++j) {
      sink.point(
        record.readDoubleLE(44 + n * 4 + j * 16),    // x
        record.readDoubleLE(44 + n * 4 + j * 16 + 8) // y
      );
    }
    sink.lineEnd();
    sink.polygonEnd();
  }
}

function readMultiPoint(record, sink) {
  var n = record.readInt32LE(36);

  sink.bbox(
    record.readDoubleLE(4),  // x0
    record.readDoubleLE(20), // x1
    record.readDoubleLE(12), // y0
    record.readDoubleLE(28)  // y1
  );

  for (var i = 0; i < n; ++i) {
    sink.point(
      record.readDoubleLE(40 + i * 16),    // x
      record.readDoubleLE(40 + i * 16 + 8) // y
    );
  }
}
