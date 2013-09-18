var fs = require("fs"),
    os = require("os");

module.exports = function(filename, callback) {
  var stream = fs.createWriteStream(filename, "utf8"),
      bufferSize = 16 * 1024,
      bufferIndex = 0,
      buffer = new Buffer(bufferSize),
      stack = [],
      geometry,
      firstPolygon, // within the first polygon of a possible MultiPolygon?
      firstLine, // within the first line of a possible MultiLineString?
      lineIndex = 0,
      pointIndex = 0;

  function geometryStart() {
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
  }

  function geometryEnd() {

    if (firstPolygon) {
      if (geometry.properties || geometry.bbox) write(",");
      write("\"coordinates\":[");
      for (var i = 0, n = firstPolygon.length; i < n; ++i) {
        if (i) write(",");
        write("[");
        for (var ring = firstPolygon[i], j = 0, m = ring.length, point; j < m; ++j) {
          point = ring[j];
          if (j) write(",");
          write("[" + point[0] + "," + point[1] + "]");
        }
        write("]");
      }
      firstPolygon = firstLine = null;
    }

    else if (firstLine) {
      if (geometry.properties || geometry.bbox) write(",");
      write("\"coordinates\":[");
      for (var j = 0, m = firstLine.length, point; j < m; ++j) {
        point = firstLine[j];
        if (j) write(",");
        write("[" + point[0] + "," + point[1] + "]");
      }
      firstLine = null;
    }

    pointIndex = lineIndex = 0;

    if (geometry.type) write("]"); // close coordinates or geometries
    if (geometry.type || geometry.properties) write(",");
    write("\"type\":" + names[geometry.type] + "}");

    geometry = stack.pop();
    if (!geometry) {
      flush();
      if (callback) callback(null);
    }
  }

  function property(name, value) {
    if (!geometry.properties) write("\"properties\":{"), geometry.properties = true;
    else write(",");
    write(JSON.stringify(name) + ":" + JSON.stringify(value));
  }

  function bbox(x0, x1, y0, y1) {
    if (geometry.properties) write("},");
    geometry.bbox = true;
    write("\"bbox\":[" + x0 + "," + y0 + "," + x1 + "," + y1 + "]");
  }

  function polygonStart() {
    if (geometry.type === Null) {
      geometry.type = Polygon;
      firstPolygon = [];
    } else if (geometry.type === Polygon) {
      geometry.type = MultiPolygon;
      if (geometry.properties || geometry.bbox) write(",");
      write("\"coordinates\":[[");
      for (var i = 0, n = firstPolygon.length; i < n; ++i) {
        if (i) write(",");
        write("[");
        for (var ring = firstPolygon[i], j = 0, m = ring.length, point; j < m; ++j) {
          point = ring[j];
          if (j) write(",");
          write("[" + point[0] + "," + point[1] + "]");
        }
        write("]");
      }
      write("],[");
      firstPolygon = firstLine = null;
    } else {
      write(",[");
    }
  }

  function polygonEnd() {
    if (!firstPolygon) {
      write("]");
    }
    lineIndex = 0;
  }

  function lineStart() {
    if (geometry.type === Null) {
      geometry.type = LineString;
      firstLine = [];
    } else if (geometry.type === LineString) {
      geometry.type = MultiLineString;
      if (geometry.properties || geometry.bbox) write(",");
      write("\"coordinates\":[[");
      for (var j = 0, m = firstLine.length, point; j < m; ++j) {
        point = firstLine[j];
        if (j) write(",");
        write("[" + point[0] + "," + point[1] + "]");
      }
      write("],[");
      firstLine = null;
    } else if (firstPolygon) {
      firstPolygon.push(firstLine = []);
    } else {
      if (lineIndex++) write(",");
      write("[");
    }
  }

  function lineEnd() {
    if (!firstLine) {
      write("]");
    }
  }

  function point(x, y) {
    if (firstLine) {
      firstLine.push([x, y]);
    } else {
      if (pointIndex++) write(",");
      write("[" + x + "," + y + "]");
    }
  }

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
    geometryStart: geometryStart,
    geometryEnd: geometryEnd,
    property: property,
    bbox: bbox,
    polygonStart: polygonStart,
    polygonEnd: polygonEnd,
    lineStart: lineStart,
    lineEnd: lineEnd,
    point: point
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
  "null",
  "\"Point\"",
  "\"MultiPoint\"",
  "\"LineString\"",
  "\"MultiLineString\"",
  "\"Polygon\"",
  "\"MultiPolygon\"",
  "\"GeometryCollection\""
];
