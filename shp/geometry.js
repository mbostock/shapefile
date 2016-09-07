var shapeTypes = {
  0: none,
  1: point,
  3: polyline,
  5: polygon,
  8: multipoint,
  11: point, // PointZ
  13: polyline, // PolyLineZ
  15: polygon, // PolygonZ
  18: multipoint // MultiPointZ
};

function none() {
  return null;
}

export default function geometry(shapeType) {
  if (!(shapeType in shapeTypes)) throw new Error("unknown shape type: " + shapeType);
  var convert = shapeTypes[shapeType];
  return function(record) { return record.shapeType ? convert(record) : null; };
}

function point(record) {
  return {type: "Point", coordinates: [record.x, record.y]};
}

function multipoint(record) {
  return {type: "MultiPoint", coordinates: record.points};
}

function polyline(record) {
  return record.parts.length === 1
      ? {type: "LineString", coordinates: record.points}
      : {type: "MultiLineString", coordinates: record.parts.map(function(i, j) { return record.points.slice(i, record.parts[j + 1]); })};
}

function polygon(record) {
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

function ringClockwise(ring) {
  if ((n = ring.length) < 4) return false;
  var i = 0, n, area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
  while (++i < n) area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
  return area >= 0;
}

function ringContains(ring, point) {
  var x = point[0], y = point[1], contains = false;
  for (var i = 0, n = ring.length, j = n - 1; i < n; j = i++) {
    var pi = ring[i], xi = pi[0], yi = pi[1],
        pj = ring[j], xj = pj[0], yj = pj[1];
    if (((yi > y) ^ (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) contains = !contains;
  }
  return contains;
}
