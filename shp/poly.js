module.exports = function(shapeType) {
  return function(record) {
    var box = [record.readDoubleLE(4), record.readDoubleLE(12), record.readDoubleLE(20), record.readDoubleLE(28)],
        numParts = record.readInt32LE(36),
        numPoints = record.readInt32LE(40),
        parts = new Array(numParts),
        points = new Array(numPoints),
        i = 44,
        j;
    for (j = 0; j < numParts; ++j, i += 4) parts[j] = record.readInt32LE(i);
    for (j = 0; j < numPoints; ++j, i += 16) points[j] = [record.readDoubleLE(i), record.readDoubleLE(i + 8)];
    return {
      shapeType: shapeType,
      box: box,
      parts: parts,
      points: points
    };
  };
};
