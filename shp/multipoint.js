module.exports = function(record) {
  var box = [record.readDoubleLE(4), record.readDoubleLE(12), record.readDoubleLE(20), record.readDoubleLE(28)],
      numPoints = record.readInt32LE(36),
      points = new Array(numPoints),
      i = 40,
      j;
  for (j = 0; j < numPoints; ++j, i += 16) points[j] = [record.readDoubleLE(i), record.readDoubleLE(i + 8)];
  return {
    shapeType: 8,
    box: box,
    points: points
  };
};
