import dbf from "../dbf/index";
import shp from "../shp/index";
import shapefile_cancel from "./cancel";
import shapefile_read from "./read";

export default function(shpSource, dbfSource, decoder) {
  return Promise.all([
    shp(shpSource),
    dbfSource && dbf(dbfSource, decoder)
  ]).then(function(sources) {
    return new Shapefile(sources[0], sources[1]);
  });
}

function Shapefile(shp, dbf) {
  this._shp = shp;
  this._dbf = dbf;
  this.bbox = shp.bbox;
}

var prototype = Shapefile.prototype;
prototype.read = shapefile_read;
prototype.cancel = shapefile_cancel;
