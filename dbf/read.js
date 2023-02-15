import readBoolean from "./boolean";
import readDate from "./date";
import readNumber from "./number";
import readString from "./string";

var types = {
  B: readNumber,
  C: readString,
  D: readDate,
  F: readNumber,
  L: readBoolean,
  M: readNumber,
  N: readNumber
};

export default function() {
  var that = this, i = 1;
  return that._source.slice(that._recordLength).then(function(value) {
    return value && (value[0] !== 0x1a) ? {done: false, value: that._fields.reduce(function(p, f) {
      var v = value.subarray(i, i += f.length);
      var j = v.indexOf(0);
      if (j > -1) v = v.subarray(0, j);
      p[f.name] = types[f.type](that._decode(v), "");
      return p;
    }, {})} : {done: true, value: undefined};
  });
}
