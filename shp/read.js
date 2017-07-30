import concat from "./concat";
import view from "../view";

export default function() {
  var that = this;
  ++that._index;
  return that._source.slice(12).then(function(array) {
    if (array == null) return {done: true, value: undefined};
    var header = view(array), type = header.getInt32(8, true);

    // If the record starts with an invalid shape type (see #36), scan ahead in
    // eight-byte increments to find the next valid object. This object is
    // identified by a header containing the expected index and a record
    // starting with an valid shape type.
    function scan() {
      return that._source.slice(8).then(function(chunk) {
        if (chunk == null) return {done: true, value: undefined};
        header = view(array = concat(array.slice(8), chunk)), type = header.getInt32(8, true);
        return header.getInt32(0, false) !== that._index || (type && type !== that._type) ? scan() : read();
      });
    }

    function read() {
      return that._source.slice(header.getInt32(4, false) * 2 - 4).then(function(chunk) {
        return {done: false, value: type ? that._parse(view(concat(array.slice(8), chunk))) : null};
      });
    }

    return type && type !== that._type ? scan() : read();
  });
}
