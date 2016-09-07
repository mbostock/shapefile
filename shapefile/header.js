import properties from "../dbf/properties";
import geometry from "../shp/geometry";

export default function(path) {
  var that = this;
  return Promise.all([
    that._dbf && that._dbf.header(),
    that._shp.header()
  ]).then(function(results) {
    var dbf = results[0], shp = results[1];
    if (dbf) that._properties = properties(dbf.fields);
    that._geometry = geometry(shp.shapeType);
    return {bbox: shp.box};
  });
}
