var fs = require("fs"),
    os = require("os");

module.exports = function(filename, callback) {
  var stream = fs.createWriteStream(filename, "utf8"),
      bufferSize = 16 * 1024,
      bufferIndex = 0,
      buffer = new Buffer(bufferSize),
      stack = [],
      geometry,
      polygon,
      line;

  function write(chunk) {
    bufferIndex += buffer.write(chunk, bufferIndex);
    while (Buffer._charsWritten < chunk.length) {
      flush();
      bufferIndex = buffer.write(chunk = chunk.substring(Buffer._charsWritten));
    }
  }

  function flush() {
    if (bufferIndex) {
      stream.write(buffer.slice(0, bufferIndex));
      buffer = new Buffer(bufferSize);
      bufferIndex = 0;
    }
  }

  return {
    geometryStart: function() {
      if (geometry) {
        stack.push(geometry);
        if (geometry.type === Null) {
          geometry.type = GeometryCollection;
          if (geometry.properties || geometry.bbox) write(",");
          write("\"geometries\":[");
        } else {
          write(",");
        }
      }
      geometry = {type: Null};
      write("{");
    },
    geometryEnd: function() {

      if (line) {
        if (geometry.properties || geometry.bbox) write(",");
        write("\"coordinates\":[");
        for (var j = 0, m = line.length, point; j < m; ++j) {
          point = line[j];
          if (j) write(",");
          write("[");
          write(JSON.stringify(point[0]));
          write(",");
          write(JSON.stringify(point[1]));
          write("]");
        }
        line = null;
      }

      if (geometry.type) write("]"); // close coordinates or geometries
      if (geometry.type || geometry.properties) write(",");
      write("\"type\":");
      write(names[geometry.type]);
      write("}");
      geometry = stack.pop();
      if (!geometry && callback) callback(null);
    },
    property: function(name, value) {
      if (!geometry.properties) write("\"properties\":{"), geometry.properties = true;
      else write(",");
      write("\"");
      write(JSON.stringify(name));
      write("\":");
      write(JSON.stringify(value));
    },
    bbox: function(x0, x1, y0, y1) {
      if (geometry.properties) write(",");
      geometry.bbox = true;
      write("\"bbox\":[");
      write(JSON.stringify(x0));
      write(",");
      write(JSON.stringify(y0));
      write(",");
      write(JSON.stringify(x1));
      write(",");
      write(JSON.stringify(y1));
      write("]");
    },
    // polygonStart: function() {
    //   if (geometry.type === Null) {
    //     polygon = [];
    //     geometry.type = Polygon;
    //   } else if (geometry.type === Polygon) {
    //     geometry.type = MultiPolygon;
    //     if (geometry.properties || geometry.bbox) write(",");
    //     write("\"coordinates\":[[");
    //     for (var i = 0, n = polygon.length; i < n; ++i) {
    //       write("[");
    //       for (var line = polygon[i], j = 0, m = line.length, point; j < m; ++j) {
    //         point = line[j];
    //         write("[");
    //         write(JSON.stringify(point[0]));
    //         write(",");
    //         write(JSON.stringify(point[1]));
    //         write("]");
    //       }
    //       write("]");
    //     }
    //     write("],[");
    //     polygon = null;
    //   } else {
    //     write(",[");
    //   }
    // },
    // polygonEnd: function() {
    //   if (polygon) {
    //     if (geometry.properties || geometry.bbox) write(",");
    //     write("\"coordinates\":[");
    //     for (var i = 0, n = polygon.length; i < n; ++i) {
    //       write("[");
    //       for (var line = polygon[i], j = 0, m = line.length, point; j < m; ++j) {
    //         point = line[j];
    //         write("[");
    //         write(JSON.stringify(point[0]));
    //         write(",");
    //         write(JSON.stringify(point[1]));
    //         write("]");
    //       }
    //       write("]");
    //     }
    //     write("]");
    //     polygon = null;
    //   } else {
    //     write("]");
    //   }
    // },
    lineStart: function() { // TODO polygons
      if (geometry.type === Null) {
        geometry.type = LineString;
        line = [];
      } else if (geometry.type === LineString) {
        geometry.type = MultiLineString;
        if (geometry.properties || geometry.bbox) write(",");
        write("\"coordinates\":[[");
        for (var j = 0, m = line.length, point; j < m; ++j) {
          point = line[j];
          if (j) write(",");
          write("[");
          write(JSON.stringify(point[0]));
          write(",");
          write(JSON.stringify(point[1]));
          write("]");
        }
        write("],[");
        line = null;
      } else {
        write(",[");
      }
    },
    lineEnd: function() {
      if (!line) {
        write("]");
      }
    },
    point: function(x, y) {
      if (line) {
        line.push([x, y]);
      } else {
        if (geometry.point) write(",");
        else geometry.point = true;
        write("[");
        write(JSON.stringify(x));
        write(",");
        write(JSON.stringify(y));
        write("]");
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
