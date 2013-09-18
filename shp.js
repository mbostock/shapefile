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
      sink.geometryStart();
      sink.bbox(
        fileHeader.readDoubleLE(36), // x0
        fileHeader.readDoubleLE(52), // x1
        fileHeader.readDoubleLE(44), // y0
        fileHeader.readDoubleLE(60)  // y1
      );
      readShapeType = readShape[shapeType] || readNull;
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
  0: readNull,
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

function readNull(record, sink) {
  // noop
}

function readPoint(record, sink) {
  sink.point(record.readDoubleLE(4), record.readDoubleLE(12));
}

function readMultiPoint(record, sink) {
  var n = record.readInt32LE(36);

  // sink.bbox(
  //   record.readDoubleLE(4),  // x0
  //   record.readDoubleLE(20), // x1
  //   record.readDoubleLE(12), // y0
  //   record.readDoubleLE(28)  // y1
  // );

  for (var i = 0; i < n; ++i) {
    sink.point(
      record.readDoubleLE(40 + i * 16),    // x
      record.readDoubleLE(40 + i * 16 + 8) // y
    );
  }
}

function readPolyline(record, sink) {
  var n = record.readInt32LE(36),
      m = record.readInt32LE(40),
      pointOffset = 44 + n * 4;

  // sink.bbox(
  //   record.readDoubleLE(4),  // x0
  //   record.readDoubleLE(20), // x1
  //   record.readDoubleLE(12), // y0
  //   record.readDoubleLE(28)  // y1
  // );

  for (var i = 0, j = pointOffset + (record.readInt32LE(44) << 4); i < n; ++i, j = k) {
    sink.lineStart();
    for (var k = pointOffset + ((i < n - 1 ? record.readInt32LE(48 + (i << 2)) : m) << 4); j < k; j += 16) {
      sink.point(
        record.readDoubleLE(j),    // x
        record.readDoubleLE(j + 8) // y
      );
    }
    sink.lineEnd();
  }
}

function readPolygon(record, sink) {
  var n = record.readInt32LE(36),
      m = record.readInt32LE(40),
      pointOffset = 44 + (n << 2),
      rings = new Array(m);

  // sink.bbox(
  //   record.readDoubleLE(4),  // x0
  //   record.readDoubleLE(20), // x1
  //   record.readDoubleLE(12), // y0
  //   record.readDoubleLE(28)  // y1
  // );

  // Extract the ring indexes.
  for (var i = 0, j = pointOffset + (record.readInt32LE(44) << 4); i < n; ++i) {
    rings[i] = {0: j, 1: j = pointOffset + ((i < n - 1 ? record.readInt32LE(48 + (i << 2)) : m) << 4)};
  }

  // Find all the interior rings, and bind them to an exterior ring.
  for (var i = 0, hole; i < n; ++i) {
    if (!ringClockwise(record, hole = rings[i])) {
      var j = hole[0],
          x = record.readDoubleLE(j),
          y = record.readDoubleLE(j + 8);
      rings[i] = null;
      for (var j = 0, ring; j < n; ++j) {
        if ((ring = rings[j]) && ringContains(record, ring, x, y)) {
          hole.next = ring.next;
          ring.next = hole;
          break;
        }
      }
    }
  }

  // Output all the rings, grouping interior rings by exterior ring.
  for (var i = 0, ring; i < n; ++i) {
    if (ring = rings[i]) {
      sink.polygonStart();
      do {
        sink.lineStart();
        for (var j = ring[0], k = ring[1]; j < k; j += 16) {
          sink.point(
            record.readDoubleLE(j),    // x
            record.readDoubleLE(j + 8) // y
          );
        }
        sink.lineEnd();
      } while (ring = ring.next);
      sink.polygonEnd();
    }
  }
}

function ringClockwise(record, ring) {
  var area = 0,
      i = ring[0],
      j = ring[1],
      x0,
      y0,
      x1 = record.readDoubleLE(j - 16),
      y1 = record.readDoubleLE(j - 8);

  while (i < j) {
    x0 = x1;
    y0 = y1;
    x1 = record.readDoubleLE(i);
    y1 = record.readDoubleLE(i + 8);
    area += y0 * x1 - x0 * y1;
    i += 16;
  }

  return area >= 0;
}

function ringContains(record, ring, x, y) {
  var contains = false,
      i = ring[0],
      j = ring[1],
      x0,
      y0,
      x1 = record.readDoubleLE(j - 16),
      y1 = record.readDoubleLE(j - 8);

  while (i < j) {
    x0 = x1;
    y0 = y1;
    x1 = record.readDoubleLE(i);
    y1 = record.readDoubleLE(i + 8);
    if (((y0 > y) ^ (y1 > y)) && (x < (x1 - x0) * (y - y0) / (y1 - y0) + x0)) contains = !contains;
    i += 16;
  }

  return contains;
}
