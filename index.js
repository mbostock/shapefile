var shp = require("./shp"),
    dbf = require("./dbf"),
    noproperties = require("./dbf/noproperties");

function source(options) {
  var ignoreProperties = false;
  if (options && (options["ignore-properties"] != null)) ignoreProperties = !!options["ignore-properties"];
  return new Shapefile(shp.source(options), ignoreProperties ? null : dbf.source(options));
}

exports.source = source;

exports.open = function(path, options) {
  return source(options).open(path);
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
