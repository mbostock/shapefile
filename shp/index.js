import slice from "slice-source";
import view from "../view";
import shp_cancel from "./cancel";
import readMultiPoint from "./multipoint";
import readNull from "./null";
import readPoint from "./point";
import readPolygon from "./polygon";
import readPolyLine from "./polyline";
import shp_read from "./read";

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
};

export default function(source) {
  source = slice(source);
  return source.slice(100).then(function(array) {
    return new Shp(source, view(array));
  });
};

function Shp(source, header) {
  var type = header.getInt32(32, true);
  if (!(type in types)) throw new Error("unsupported shape type: " + type);
  this._source = source;
  this._type = types[type];
  this.bbox = [header.getFloat64(36, true), header.getFloat64(44, true), header.getFloat64(52, true), header.getFloat64(60, true)];
}

var prototype = Shp.prototype;
prototype.read = shp_read;
prototype.cancel = shp_cancel;
