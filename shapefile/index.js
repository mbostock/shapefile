import dbf from "../dbf/index";
import noproperties from "../dbf/noproperties";
import shp from "../shp/index";
import nogeometry from "../shp/nogeometry";
import shapefile_cancel from "./cancel";
import shapefile_header from "./header";
import shapefile_record from "./record";

export default function(shpSource, dbfSource, decoder) {
  return new Shapefile(shpSource, dbfSource, decoder);
}

function Shapefile(shpSource, dbfSource, decoder) {
  this._shp = shp(shpSource);
  this._dbf = dbf(dbfSource, decoder);
  this._properties = noproperties;
  this._geometry = nogeometry;
}

var prototype = Shapefile.prototype;
prototype.header = shapefile_header;
prototype.record = shapefile_record;
prototype.cancel = shapefile_cancel;
