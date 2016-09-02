module.exports = function(path) {
  if (/\.shp$/i.test(path += "")) path = path.substring(0, path.length - 4);
  return Promise.all([
    this._dbf && this._dbf.open(path + ".dbf"),
    this._shp.open(path + ".shp")
  ]).then(() => this);
};
