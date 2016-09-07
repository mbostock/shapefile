export default function() {
  var that = this;
  return Promise.all([
    that._dbf && that._dbf.read(),
    that._shp.read()
  ]).then(function(results) {
    var dbf = results[0], shp = results[1];
    return shp.done ? shp : {
      done: false,
      value: {
        type: "Feature",
        properties: that._properties(dbf && dbf.value),
        geometry: that._geometry(shp.value)
      }
    };
  });
};
