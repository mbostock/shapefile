var shp = require("./shp"),
    dbf = require("./dbf");

exports.read = function(filename, callback) {
  if (/\.shp$/.test(filename)) filename = filename.substring(0, filename.length - 4);

  readProperties(filename, function(error, properties) {
    if (error) return callback(error);
    readGeometries(filename, function(error, geometries) {
      if (error) return callback(error);
      var i = -1, n = geometries.length, features = new Array(n);
      while (++i < n) features[i] = {
        type: "Feature",
        properties: properties[i],
        geometry: geometries[i]
      };
      callback(null, {
        type: "FeatureCollection",
        features: features
      });
    });
  });
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

function readGeometries(filename, callback) {
  var geometries = [],
      convert;

  shp.readStream(filename + ".shp")
      .on("header", function(header) { convert = convertGeometry[header.shapeType]; })
      .on("record", function(record) { geometries.push(record == null ? null : convert(record)); })
      .on("error", callback)
      .on("end", function() { callback(null, geometries); });
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
  return record.parts.length === 1 ? {
    type: "Polygon",
    coordinates: record.points
  } : {
    type: "MultiPolygon",
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
