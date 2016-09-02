var shp = require("./shp"),
    dbf = require("./dbf"),
    noproperties = require("./dbf/noproperties");

function source(options) {
  var ignoreProperties = false;
  if (options && (options.ignoreProperties != null)) ignoreProperties = !!options.ignoreProperties;
  return new Shapefile(shp.source(options), ignoreProperties ? null : dbf.source(options));
}

exports.source = source;

exports.open = function(path, options) {
  return source(options).open(path);
};

exports.read = function(path, options) {
  var features = [], collection = {type: "FeatureCollection", bbox: null, features: features};
  return source(options).open(path)
    .then((file) => file.header()
      .then((header) => collection.bbox = header.bbox)
      .then(function next() { return file.record().then((record) => record && (features.push(record), next())); })
      .catch((error) => file.close().then(() => { throw error; }))
      .then(() => (file.close(), collection)));
};

function Shapefile(shp, dbf) {
  this._shp = shp;
  this._dbf = dbf;
  this._properties = noproperties;
  this._geometry = null;
}

var prototype = source.prototype = Shapefile.prototype;
prototype.open = require("./open");
prototype.header = require("./header");
prototype.record = require("./record");
prototype.close = require("./close");
