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
  return {
    type: "Polygon",
    coordinates: record.parts.map(function(i, j) {
      return record.points.slice(i, record.parts[j + 1]);
    })
  };
}

function convertMultiPoint(record) {
  return {
    type: "MultiPoint",
    coordinates: record.points
  };
}
