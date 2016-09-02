var file = require("file-source"),
    iconv = require("iconv-lite"),
    utf8 = /^utf[-]?8$/i;

function decoder(encoding) {
  return function(buffer, i, j) {
    return iconv.decode(buffer.slice(i, j), encoding);
  };
}

function decodeUtf8(buffer, i, j) {
  return buffer.toString("utf8", i, j);
}

function source(path, options) {
  var encoding = "utf8";
  if (options && (options.encoding != null)) encoding = options.encoding + "";
  return new Dbf(file.source(path, options), encoding);
}

exports.source = source;

exports.open = function(path, options) {
  return source(options).open(path);
};

function Dbf(file, encoding) {
  this._file = file;
  this._decode = utf8.test(encoding) ? decodeUtf8 : decoder(encoding || "ISO-8859-1")
  this._version = null;
  this._date = null;
  this._length = null;
  this._recordLength = null;
  this._fields = [];
}

var prototype = source.prototype = Dbf.prototype;
prototype.open = require("./open");
prototype.header = require("./header");
prototype.record = require("./record");
prototype.close = require("./close");
