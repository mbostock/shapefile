module.exports = function(path) {
  if (this._geometry == null) throw new Error("must read header before records");
  return Promise.all([
    this._dbf && this._dbf.record(),
    this._shp.record()
  ]).then(([dbf, shp]) => {
    return shp && {
      type: "Feature",
      properties: this._properties(dbf),
      geometry: this._geometry(shp)
    };
  });
};
