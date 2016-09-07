import slice from "slice-source";
import shp_cancel from "./cancel";
import shp_read from "./read";
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

export default function(source) {
  source = slice(source);
  return source.slice(100).then(function(array) {
    return new Shp(source, view(array));
  });
};

function Shp(source, header) {
  this.shapeType = header.getInt32(32, true);
  if (!(this.shapeType in types)) throw new Error("unsupported shape type: " + this.shapeType);
  this._source = source;
  this._type = types[this.shapeType];
  this.fileCode = header.getInt32(0, false);
  this.version =  header.getInt32(28, true);
  this.box = [header.getFloat64(36, true), header.getFloat64(44, true), header.getFloat64(52, true), header.getFloat64(60, true)];
}

var prototype = Shp.prototype;
prototype.read = shp_read;
prototype.cancel = shp_cancel;
