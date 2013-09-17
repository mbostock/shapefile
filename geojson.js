var fs = require("fs"),
    os = require("os");

module.exports = function(filename, callback) {
  var stream = fs.createWriteStream(filename, "utf8"),
      stack = [],
      geometry,
      polygon,
      line;

  return {
    geometryStart: function() {
      if (geometry) {
        stack.push(geometry);
        if (geometry.type === Null) {
          geometry.type = GeometryCollection;
          if (geometry.properties || geometry.bbox) stream.write(",");
          stream.write("\"geometries\":[");
          stream.write(os.EOL);
        } else {
          stream.write(",");
        }
      }
      geometry = {type: Null};
      stream.write("{");
    },
    geometryEnd: function() {

      if (line) {
        if (geometry.properties || geometry.bbox) stream.write(",");
        stream.write("\"coordinates\":[");
        for (var j = 0, m = line.length, point; j < m; ++j) {
          point = line[j];
          if (j) stream.write(",");
          stream.write("[");
          stream.write(JSON.stringify(point[0]));
          stream.write(",");
          stream.write(JSON.stringify(point[1]));
          stream.write("]");
        }
        line = null;
      }

      if (geometry.type) stream.write("]"); // close coordinates or geometries
      if (geometry.type || geometry.properties) stream.write(",");
      stream.write("\"type\":");
      stream.write(names[geometry.type]);
      stream.write("}");
      stream.write(os.EOL);
      geometry = stack.pop();
      if (!geometry && callback) callback(null);
    },
    property: function(name, value) {
      if (!geometry.properties) stream.write("\"properties\":{"), geometry.properties = true;
      else stream.write(",");
      stream.write("\"");
      stream.write(JSON.stringify(name));
      stream.write("\":");
      stream.write(JSON.stringify(value));
    },
    bbox: function(x0, x1, y0, y1) {
      if (geometry.properties) stream.write(",");
      geometry.bbox = true;
      stream.write("\"bbox\":[");
      stream.write(JSON.stringify(x0));
      stream.write(",");
      stream.write(JSON.stringify(y0));
      stream.write(",");
      stream.write(JSON.stringify(x1));
      stream.write(",");
      stream.write(JSON.stringify(y1));
      stream.write("]");
    },
    // polygonStart: function() {
    //   if (geometry.type === Null) {
    //     polygon = [];
    //     geometry.type = Polygon;
    //   } else if (geometry.type === Polygon) {
    //     geometry.type = MultiPolygon;
    //     if (geometry.properties || geometry.bbox) stream.write(",");
    //     stream.write("\"coordinates\":[[");
    //     for (var i = 0, n = polygon.length; i < n; ++i) {
    //       stream.write("[");
    //       for (var line = polygon[i], j = 0, m = line.length, point; j < m; ++j) {
    //         point = line[j];
    //         stream.write("[");
    //         stream.write(JSON.stringify(point[0]));
    //         stream.write(",");
    //         stream.write(JSON.stringify(point[1]));
    //         stream.write("]");
    //       }
    //       stream.write("]");
    //     }
    //     stream.write("],[");
    //     polygon = null;
    //   } else {
    //     stream.write(",[");
    //   }
    // },
    // polygonEnd: function() {
    //   if (polygon) {
    //     if (geometry.properties || geometry.bbox) stream.write(",");
    //     stream.write("\"coordinates\":[");
    //     for (var i = 0, n = polygon.length; i < n; ++i) {
    //       stream.write("[");
    //       for (var line = polygon[i], j = 0, m = line.length, point; j < m; ++j) {
    //         point = line[j];
    //         stream.write("[");
    //         stream.write(JSON.stringify(point[0]));
    //         stream.write(",");
    //         stream.write(JSON.stringify(point[1]));
    //         stream.write("]");
    //       }
    //       stream.write("]");
    //     }
    //     stream.write("]");
    //     polygon = null;
    //   } else {
    //     stream.write("]");
    //   }
    // },
    lineStart: function() { // TODO polygons
      if (geometry.type === Null) {
        geometry.type = LineString;
        line = [];
      } else if (geometry.type === LineString) {
        geometry.type = MultiLineString;
        if (geometry.properties || geometry.bbox) stream.write(",");
        stream.write("\"coordinates\":[[");
        for (var j = 0, m = line.length, point; j < m; ++j) {
          point = line[j];
          if (j) stream.write(",");
          stream.write("[");
          stream.write(JSON.stringify(point[0]));
          stream.write(",");
          stream.write(JSON.stringify(point[1]));
          stream.write("]");
        }
        stream.write("],[");
        line = null;
      } else {
        stream.write(",[");
      }
    },
    lineEnd: function() {
      if (!line) {
        stream.write("]");
      }
    },
    point: function(x, y) {
      if (line) {
        line.push([x, y]);
      } else {
        if (geometry.point) stream.write(",");
        else geometry.point = true;
        stream.write("[");
        stream.write(JSON.stringify(x));
        stream.write(",");
        stream.write(JSON.stringify(y));
        stream.write("]");
      }
    }
  };
};

var Null = 0,
    Point = 1,
    MultiPoint = 2,
    LineString = 3,
    MultiLineString = 4,
    Polygon = 5,
    MultiPolygon = 6,
    GeometryCollection = 7;

var names = [
  null,
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
  "GeometryCollection"
].map(JSON.stringify);
