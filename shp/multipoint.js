export default function(record) {
  var i = 40, j, n = record.getInt32(36, true), points = new Array(n);
  for (j = 0; j < n; ++j, i += 16) points[j] = [record.getFloat64(i, true), record.getFloat64(i + 8, true)];
  return {shapeType: 8, box: [record.getFloat64(4, true), record.getFloat64(12, true), record.getFloat64(20, true), record.getFloat64(28, true)], points: points};
};
