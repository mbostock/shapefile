var events = require("events");

var shp = require("./shp"),
    dbf = require("./dbf");

exports.readStream = function(filename) {
  var emitter = new events.EventEmitter();

  if (/\.shp$/.test(filename)) filename = filename.substring(0, filename.length - 4);

  readProperties(filename, function(error, properties) {
    if (error) return void emitter.emit("error", error);
    var geometries = [],
        convert;

    properties.reverse(); // for efficient pop

    shp.readStream(filename + ".shp")
        .on("header", function(header) { convert = convertGeometry[header.shapeType]; })
        .on("record", function(record) {
          emitter.emit("feature", {
            type: "Feature",
            properties: properties.pop(),
            geometry: record == null ? null : convert(record)
          });
        })
        .on("error", function() { emitter.emit("error", error); })
        .on("end", function() { emitter.emit("end"); });
  });

  return emitter;
};

function readProperties(filename, callback) {
  var properties = [],
      convert;

  dbf.readStream(filename + ".dbf")
      .on("header", function(header) {
        convert = new Function("d", "return {"
            + header.fields.map(function(field, i) { return JSON.stringify(field.name) + ":d[" + i + "]"; })
            + "};");
      })
      .on("record", function(record) { properties.push(convert(record)); })
      .on("error", callback)
      .on("end", function() { callback(null, properties); });
}

var convertGeometry = {
  1: convertPoint,
  3: convertPolyLine,
  5: convertPolygon,
  8: convertMultiPoint
};

function convertPoint(record) {
  return {
    type: "Point",
    coordinates: [record.x, record.y]
  };
}

function convertPolyLine(record) {
  return record.parts.length === 1 ? {
    type: "LineString",
    coordinates: record.points
  } : {
    type: "MultiLineString",
    coordinates: record.parts.map(function(i, j) {
      return record.points.slice(i, record.parts[j + 1]);
    })
  };
}

function convertPolygon(record) {
  var parts = record.parts.map(function(i, j) { return record.points.slice(i, record.parts[j + 1]); }),
      polygons = [],
      holes = [];

  parts.forEach(function(part) {
    if (ringClockwise(part)) polygons.push([part]);
    else holes.push(part);
  });

  holes.forEach(function(hole) {
    var point = hole[0];
    polygons.some(function(polygon) {
      if (ringContains(polygon[0], point)) {
        polygon.push(hole);
        return true;
      }
    });
  });

  return polygons.length > 1
      ? {type: "MultiPolygon", coordinates: polygons}
      : {type: "Polygon", coordinates: polygons[0]};
}

function convertMultiPoint(record) {
  return {
    type: "MultiPoint",
    coordinates: record.points
  };
}

function ringClockwise(ring) {
  var i = 0,
      n = ring.length,
      area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
  while (++i < n) area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
  return area >= 0;
}

function ringContains(ring, point) {
  var x = point[0],
      y = point[1],
      contains = false;
  for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    var pi = ring[i], xi = pi[0], yi = pi[1],
        pj = ring[j], xj = pj[0], yj = pj[1];
    if (((yi > y) ^ (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) contains = !contains;
  }
  return contains;
}
