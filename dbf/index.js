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

function source(options) {
  var encoding = "ISO-8859-1";
  if (options && (options.encoding != null)) encoding = options.encoding + "";
  return new Dbf(file.source(options), encoding);
}

exports.source = source;

exports.open = function(path, options) {
  return source(options).open(path);
};

function Dbf(source, encoding) {
  this._source = source;
  this._decode = utf8.test(encoding) ? decodeUtf8 : decoder(encoding)
  this._recordLength = null;
  this._fields = [];
}

var prototype = source.prototype = Dbf.prototype;
prototype.open = require("./open");
prototype.header = require("./header");
prototype.record = require("./record");
prototype.close = require("./close");
