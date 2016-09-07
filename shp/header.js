import view from "../view";
import readNull from "./null";
import readPoint from "./point";
import readPoly from "./poly";
import readMultiPoint from "./multipoint";

var readPolyLine = readPoly(3),
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

export default function header() {
  var that = this;
  return this._source.read(100).then(function(result) {
    var header = view(result), type = header.getInt32(32, true);
    if (!(type in types)) throw new Error("unsupported shape type: " + type);
    that._type = types[type];
    return {
      fileCode: header.getInt32(0, false), // TODO verify 9994
      version: header.getInt32(28, true), // TODO verify 1000
      shapeType: type,
      box: [header.getFloat64(36, true), header.getFloat64(44, true), header.getFloat64(52, true), header.getFloat64(60, true)]
      // TODO zMin header.getDoubleLE(68)
      // TODO zMax header.getDoubleLE(76)
      // TODO mMin header.getDoubleLE(84)
      // TODO mMax header.getDoubleLE(92)
    };
  });
}
