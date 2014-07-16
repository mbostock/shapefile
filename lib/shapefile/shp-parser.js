var fixedParser = require("./fixed-parser");

var STATES = 0,
    STATE_FILE_HEADER = ++STATES,
    STATE_RECORD_HEADER = ++STATES,
    STATE_RECORD = ++STATES;

module.exports = function() {
  var parser = {
        push: parser_push,
        pop: parser_pop
      },
      fixed = fixedParser(),
      state = STATE_FILE_HEADER,
      convertRecord,
      recordHeader;

  function parser_push(data) {
    fixed.push(data);
  }

  function parser_pop() {
    while (true) {
      switch (state) {
        case STATE_FILE_HEADER: {
          var fileHeader;
          if ((fileHeader = fixed.pop(100)) == null) return null;
          var shapeType = fileHeader.readInt32LE(32);
          convertRecord = convertRecordByShapeType[shapeType];
          if (convertRecord == null) throw new Error("unknown shape type: " + shapeType);
          state = STATE_RECORD_HEADER;
          continue;
        }
        case STATE_RECORD_HEADER: {
          if ((recordHeader = fixed.pop(8)) == null) return null;
          state = STATE_RECORD;
          continue;
        }
        case STATE_RECORD: {
          var record;
          if ((record = fixed.pop(recordHeader.readInt32BE(4) * 2)) == null) return null;
          state = STATE_RECORD_HEADER;
          return record.readInt32LE(0) ? convertRecord(record) : convertNull();
        }
        default: throw new Error("unknown state: " + state);
      }
    }
  }

  return parser;
};

var convertRecordByShapeType = {
  0: convertNull,
  1: convertPoint,
  3: convertMultiLineString, // PolyLine
  5: convertMultiPolygon, // Polygon
  8: convertMultiPoint,
  11: convertPoint, // PointZ
  13: convertMultiLineString, // PolyLineZ
  15: convertMultiPolygon, // PolygonZ
  18: convertMultiPoint // MultiPointZ
  // 21: TODO convertPointM
  // 23: TODO convertPolyLineM
  // 25: TODO convertPolygonM
  // 28: TODO convertMultiPointM
  // 31: TODO convertMultiPatch
};

function convertNull() {
  return {type: null};
}

function convertPoint(record) {
  return {
    type: "Point",
    coordinates: [record.readDoubleLE(4), record.readDoubleLE(12)]
  };
}

function convertMultiPoint(record) {
  var n = record.readInt32LE(36),
      coordinates = new Array(n);

  for (var j = 0, i = 40; j < n; ++j, i += 16) {
    coordinates[j] = [record.readDoubleLE(i), record.readDoubleLE(i + 8)];
  }

  return {
    type: "MultiPoint",
    coordinates: coordinates
  };
}

function convertMultiLineString(record) {
  var n = record.readInt32LE(36),
      m = record.readInt32LE(40),
      coordinates = new Array(n);

  for (var j = 1, i = 48, i0 = 0, i1; j < n; ++j, i += 4) {
    i1 = record.readInt32LE(i);
    coordinates[j - 1] = new Array(i1 - i0);
    i0 = i1;
  }

  if (n) {
    coordinates[n - 1] = new Array(m - i0);
  }

  for (var j = 0; j < n; ++j) {
    for (var line = coordinates[j], k = 0, m = line.length; k < m; ++k, i += 16) {
      line[k] = [record.readDoubleLE(i), record.readDoubleLE(i + 8)];
    }
  }

  return coordinates.length === 1 ? {
    type: "LineString",
    coordinates: coordinates[0]
  } : {
    type: "MultiLineString",
    coordinates: coordinates
  };
}

function convertMultiPolygon(record) {
  var n = record.readInt32LE(36),
      m = record.readInt32LE(40),
      coordinates = new Array(n),
      polygons = [],
      holes = [];

  for (var j = 1, i = 48, i0 = 0, i1; j < n; ++j, i += 4) {
    i1 = record.readInt32LE(i);
    coordinates[j - 1] = new Array(i1 - i0);
    i0 = i1;
  }

  if (n) {
    coordinates[n - 1] = new Array(m - i0);
  }

  for (var j = 0; j < n; ++j) {
    for (var ring = coordinates[j], k = 0, m = ring.length; k < m; ++k, i += 16) {
      ring[k] = [record.readDoubleLE(i), record.readDoubleLE(i + 8)];
    }
    if (ringClockwise(ring)) {
      polygons.push([ring]);
    } else {
      holes.push(ring);
    }
  }

  outer: for (var j = 0, n = holes.length; j < n; ++j) {
    for (var hole = holes[j], point = hole[0], k = 0, m = polygons.length; k < m; ++k) {
      var polygon = polygons[k];
      if (ringContains(polygon[0], point)) {
        polygon.push(hole);
        continue outer;
      }
    }
    polygons.push([hole]);
  }

  return polygons.length === 1 ? {
    type: "Polygon",
    coordinates: polygons[0]
  } : {
    type: "MultiPolygon",
    coordinates: polygons
  };
}

function convertMultiPoint(record) {
  return {
    type: "MultiPoint",
    coordinates: record.points
  };
}

function ringClockwise(ring) {
  if ((n = ring.length) < 4) return false;
  var i = 0,
      n,
      area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
  while (++i < n) area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
  return area >= 0;
}

function ringContains(ring, point) {
  var x = point[0],
      y = point[1],
      contains = false;
  for (var i = 0, n = ring.length, j = n - 1; i < n; j = i++) {
    var pi = ring[i], xi = pi[0], yi = pi[1],
        pj = ring[j], xj = pj[0], yj = pj[1];
    if (((yi > y) ^ (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) contains = !contains;
  }
  return contains;
}
