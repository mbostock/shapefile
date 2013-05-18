var events = require("events");

var shp = require("./shp"),
    dbf = require("./dbf"),
    list = require("./list");

var π = Math.PI,
    π_4 = π / 4,
    radians = π / 180;

exports.readStream = function(filename, options) {
  var emitter = new events.EventEmitter(),
      convert,
      encoding = null,
      ignoreProperties = false;

  if (typeof options === "string") options = {encoding: options};

  if (options)
    "encoding" in options && (encoding = options["encoding"]),
    "ignore-properties" in options && (ignoreProperties = !!options["ignore-properties"]);

  if (/\.shp$/.test(filename)) filename = filename.substring(0, filename.length - 4);

  if (ignoreProperties) {
    readGeometry(emptyNextProperties, emptyEnd);
  } else {
    var propertiesQueue = list(),
        callbackQueue = list(),
        endCallback,
        ended;

    readProperties(filename, encoding, function(error, properties) {
      if (error) return void emitter.emit("error", error);
      if (!callbackQueue.empty()) return void callbackQueue.pop()(null, properties);
      propertiesQueue.push(properties);
    }, function() {
      if (endCallback) return void endCallback(null);
      ended = true;
    });

    readGeometry(function(callback) {
      if (!propertiesQueue.empty()) return void callback(null, propertiesQueue.pop());
      callbackQueue.push(callback);
    }, function(callback) {
      if (ended) return void callback(null);
      endCallback = callback;
    });
  }

  function readGeometry(readNextProperties, readEnd) {
    shp.readStream(filename + ".shp")
        .on("header", function(header) {
          convert = convertGeometry[header.shapeType];
        })
        .on("record", function(record) {
          readNextProperties(function(error, properties) {
            if (error) return void emitter.emit("error", error);
            emitter.emit("feature", {
              type: "Feature",
              properties: properties,
              geometry: record == null ? null : convert(record)
            });
          });
        })
        .on("error", function(error) {
          emitter.emit("error", error);
        })
        .on("end", function() {
          readEnd(function(error) {
            if (error) return void emitter.emit("error", error);
            emitter.emit("end");
          });
        });
  }

  return emitter;
};

function readProperties(filename, encoding, propertyCallback, endCallback) {
  var properties = [],
      convert;

  dbf.readStream(filename + ".dbf", encoding)
      .on("header", function(header) {
        convert = new Function("d", "return {"
            + header.fields.map(function(field, i) { return JSON.stringify(field.name) + ":d[" + i + "]"; })
            + "};");
      })
      .on("record", function(record) { propertyCallback(null, convert(record)); })
      .on("error", propertyCallback)
      .on("end", endCallback);
}

var convertGeometry = {
  1: convertPoint,
  3: convertPolyLine,
  5: convertPolygon,
  8: convertMultiPoint,
  11: convertPoint, // PointZ
  13: convertPolyLine, // PolyLineZ
  15: convertPolygon, // PolygonZ
  18: convertMultiPoint // MultiPointZ
};

function emptyNextProperties(callback) {
  callback(null, {});
}

function emptyEnd(callback) {
  callback(null);
}

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
    }) || polygons.push([hole]);
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
  return ringArea(ring) >= 0;
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

function ringArea(ring) {
  if (!ring.length) return 0;
  var u = 1,
      v = 0,
      p = ring[0],
      λ = p[0] * radians,
      φ = p[1] * radians / 2 + π_4,
      λ0 = λ,
      cosφ0 = Math.cos(φ),
      sinφ0 = Math.sin(φ);

  for (var i = 1, n = ring.length; i < n; ++i) {
    p = ring[i], λ = p[0] * radians, φ = p[1] * radians / 2 + π_4;

    // Spherical excess E for a spherical triangle with vertices: south pole,
    // previous point, current point.  Uses a formula derived from Cagnoli’s
    // theorem.  See Todhunter, Spherical Trig. (1871), Sec. 103, Eq. (2).
    var dλ = λ - λ0,
        cosφ = Math.cos(φ),
        sinφ = Math.sin(φ),
        k = sinφ0 * sinφ,
        u0 = u,
        v0 = v,
        u1 = cosφ0 * cosφ + k * Math.cos(dλ),
        v1 = k * Math.sin(dλ);
    // ∑ arg(z) = arg(∏ z), where z = u + iv.
    u = u0 * u1 - v0 * v1;
    v = v0 * u1 + u0 * v1;

    // Advance the previous point.
    λ0 = λ, cosφ0 = cosφ, sinφ0 = sinφ;
  }

  return 2 * Math.atan2(v, u);
}
