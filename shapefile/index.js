import dbf from "../dbf/index";
import shp from "../shp/index";
import properties from "../dbf/properties";
import noproperties from "../dbf/noproperties";
import geometry from "../shp/geometry";
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
  this._properties = dbf ? properties(dbf.fields) : noproperties;
  this._geometry = geometry(shp.shapeType);
  this.bbox = shp.bbox;
}

var prototype = Shapefile.prototype;
prototype.read = shapefile_read;
prototype.cancel = shapefile_cancel;
