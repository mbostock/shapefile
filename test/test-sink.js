module.exports = function(callback) {
  var stack = [],
      geometry,
      polygon,
      line;

  return {
    geometryStart: function() {
      if (geometry) {
        if (!geometry.type) {
          geometry.type = "GeometryCollection";
          geometry.geometries = [];
        }
        stack.push(geometry);
        geometry.geometries.push(geometry = {type: null});
      } else {
        geometry = {type: null};
      }
    },
    geometryEnd: function() {
      if (stack.length) {
        geometry = stack.pop();
      } else {
        callback(null, geometry);
      }
    },
    properties: function(name, value) {
      if (!geometry.properties) geometry.properties = {};
      geometry.properties[name] = value;
    },
    bbox: function(x0, x1, y0, y1) {
      geometry.bbox = [x0, y0, x1, y1];
    },
    polygonStart: function() {
      if (!geometry.type) {
        geometry.type = "Polygon";
        geometry.coordinates = ring = [];
      } else if (geometry.type === "Polygon") {
        geometry.type = "MultiPolygon";
        geometry.coordinates = [geometry.coordinates, ring = []];
      }
    },
    polygonEnd: function() {
      ring = null;
    },
    lineStart: function() {
      if (ring) {
        ring.push(line = []);
      } else if (!geometry.type) {
        geometry.type = "LineString";
        geometry.coordinates = line = [];
      } else if (geometry.type === "LineString") {
        geometry.type = "MultiLineString";
        geometry.coordinates = [geometry.coordinates, line = []];
      } else {
        geometry.coordinates.push(line = []);
      }
    },
    lineEnd: function() {
      if (ring) line.push(line[0]); // closing coordinate
      line = null;
    },
    point: function(x, y) {
      if (line) {
        line.push([x, y]);
      } else if (!geometry.type) {
        geometry.type = "Point";
        geometry.coordinates = [x, y];
      } else if (geometry.type === "Point") {
        geometry.type = "MultiPoint";
        geometry.coordinates = [geometry.coordinates, [x, y]];
      } else {
        geometry.coordinates.push([x, y]);
      }
    }
  };
};
