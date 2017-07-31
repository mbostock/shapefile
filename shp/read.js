import concat from "./concat";
import view from "../view";

export default function() {
  var that = this;
  ++that._index;
  return that._source.slice(12).then(function(array) {
    if (array == null) return {done: true, value: undefined};
    var header = view(array);

    // If the record starts with an invalid shape type (see #36), scan ahead in
    // four-byte increments to find the next valid record, identified by the
    // expected index, a non-empty content length and a valid shape type.
    function skip() {
      return that._source.slice(4).then(function(chunk) {
        if (chunk == null) return {done: true, value: undefined};
        header = view(array = concat(array.slice(4), chunk));
        return header.getInt32(0, false) !== that._index ? skip() : read();
      });
    }

    // All records should have at least four bytes (for the record shape type),
    // so an invalid content length indicates corruption.
    function read() {
      var length = header.getInt32(4, false) * 2 - 4, type = header.getInt32(8, true);
      return length < 0 || (type && type !== that._type) ? skip() : that._source.slice(length).then(function(chunk) {
        return {done: false, value: type ? that._parse(view(concat(array.slice(8), chunk))) : null};
      });
    }

    return read();
  });
}
