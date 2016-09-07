import dbf_cancel from "./cancel";
import dbf_header from "./header";
import dbf_record from "./record";

export default function(source, options) {
  return new Dbf(source, options.decoder);
};

function Dbf(source, decoder) {
  this._source = source;
  this._decode = decoder.decode.bind(decoder);
  this._recordLength = null;
  this._fields = [];
}

var prototype = Dbf.prototype;
prototype.header = dbf_header;
prototype.record = dbf_record;
prototype.cancel = dbf_cancel;
