module.exports = function(record) {
  var x = record.readDoubleLE(4),
      y = record.readDoubleLE(12);
  return {
    shapeType: 1,
    x: x,
    y: y
  };
};
