import readNull from "./null";
import shp_cancel from "./cancel";
import shp_header from "./header";
import shp_record from "./record";

export default function shp(source) {
  return new Shp(source);
}

function Shp(source) {
  this._source = source;
  this._type = readNull;
}

var prototype = Shp.prototype;
prototype.header = shp_header;
prototype.record = shp_record;
prototype.cancel = shp_cancel;
