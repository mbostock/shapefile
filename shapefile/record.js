export default function(path) {
  var that = this;
  return Promise.all([
    that._dbf && that._dbf.record(),
    that._shp.record()
  ]).then(function(results) {
    var dbf = results[0], shp = results[1];
    return shp && {
      type: "Feature",
      properties: that._properties(dbf),
      geometry: that._geometry(shp)
    };
  });
};
