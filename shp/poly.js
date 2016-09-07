export default function(shapeType) {
  return function(record) {
    var i = 44, j, n = record.getInt32(36, true), m = record.getInt32(40, true), parts = new Array(n), points = new Array(m);
    for (j = 0; j < n; ++j, i += 4) parts[j] = record.getInt32(i, true);
    for (j = 0; j < m; ++j, i += 16) points[j] = [record.getFloat64(i, true), record.getFloat64(i + 8, true)];
    return {shapeType: shapeType, box: [record.getFloat64(4, true), record.getFloat64(12, true), record.getFloat64(20, true), record.getFloat64(28, true)], parts: parts, points: points};
  };
};
