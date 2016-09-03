var readNull = require("./null"),
    readPoint = require("./point"),
    readPoly = require("./poly"),
    readMultiPoint = require("./multipoint"),
    readPolyLine = readPoly(3),
    readPolygon = readPoly(5);

var types = {
  0: readNull,
  1: readPoint,
  3: readPolyLine,
  5: readPolygon,
  8: readMultiPoint,
  11: readPoint,
  13: readPolyLine,
  15: readPolygon,
  18: readMultiPoint
  // TODO 21 readPointM
  // TODO 23 readPolyLineM
  // TODO 25 readPolygonM
  // TODO 28 readMultiPointM
  // TODO 31 readMultiPatch
};

module.exports = function() {
  return this._source.read(100).then((buffer) => {
    var type = buffer.readInt32LE(32);
    if (!(type in types)) throw new Error("unsupported shape type: " + type);
    this._type = types[type];
    return {
      fileCode: buffer.readInt32BE(0), // TODO verify 9994
      version: buffer.readInt32LE(28), // TODO verify 1000
      shapeType: type,
      box: [buffer.readDoubleLE(36), buffer.readDoubleLE(44), buffer.readDoubleLE(52), buffer.readDoubleLE(60)]
      // TODO zMin buffer.readDoubleLE(68)
      // TODO zMax buffer.readDoubleLE(76)
      // TODO mMin buffer.readDoubleLE(84)
      // TODO mMax buffer.readDoubleLE(92)
    };
  });
};
