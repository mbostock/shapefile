var properties = require("./dbf/properties"),
    geometry = require("./shp/geometry");

module.exports = function(path) {
  return Promise.all([
    this._dbf && this._dbf.header(),
    this._shp.header()
  ]).then(([dbf, shp]) => {
    if (dbf) this._properties = properties(dbf.fields);
    this._geometry = geometry(shp.shapeType);
    return {bbox: shp.box};
  });
};
