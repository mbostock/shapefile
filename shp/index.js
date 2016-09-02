var file = require("file-source");

function source(path, options) {
  return new Shp(file.source(path, options));
}

exports.source = source;

exports.open = function(path, options) {
  return source(options).open(path);
};

function Shp(file) {
  this._file = file;
  this._type = null;
}

var prototype = source.prototype = Shp.prototype;
prototype.open = require("./open");
prototype.header = require("./header");
prototype.record = require("./record");
prototype.close = require("./close");
