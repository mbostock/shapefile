import slice from "slice-source";
import view from "../view";
import shp_cancel from "./cancel";
import parseMultiPoint from "./multipoint";
import parseNull from "./null";
import parsePoint from "./point";
import parsePolygon from "./polygon";
import parsePolyLine from "./polyline";
import shp_read from "./read";

var parsers = {
  0: parseNull,
  1: parsePoint,
  3: parsePolyLine,
  5: parsePolygon,
  8: parseMultiPoint,
  11: parsePoint, // PointZ
  13: parsePolyLine, // PolyLineZ
  15: parsePolygon, // PolygonZ
  18: parseMultiPoint, // MultiPointZ
  21: parsePoint, // PointM
  23: parsePolyLine, // PolyLineM
  25: parsePolygon, // PolygonM
  28: parseMultiPoint // MultiPointM
};

export default function(source, xform) {
  source = slice(source);
  return source.slice(100).then(function(array) {
    return new Shp(source, view(array), xform);
  });
};

function Shp(source, header, xform) {
  var type = header.getInt32(32, true);
  if (!(type in parsers)) throw new Error("unsupported shape type: " + type);
  this._source = source;
  this._xform = xform || function (x) { x };
  this._type = type;
  this._index = 0;
  this._parse = parsers[type];
  var topLeft = xform([header.getFloat64(36, true), header.getFloat64(44, true)]);
  var botRight = xform([header.getFloat64(52, true), header.getFloat64(60, true)]);
  this.bbox = [ topLeft[0], topLeft[1], botRight[0], botRight[1] ];
}

var prototype = Shp.prototype;
prototype.read = shp_read;
prototype.cancel = shp_cancel;
