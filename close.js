var noproperties = require("./dbf/noproperties");

module.exports = function(path) {
  return Promise.all([
    this._dbf && this._dbf.close(),
    this._shp.close()
  ]).then(() => (this._properties = noproperties, this._geometry = null, this));
};
