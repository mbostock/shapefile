export default function(record, xform) {
  return {type: "Point", coordinates: xform([ record.getFloat64(4, true), record.getFloat64(12, true) ])};
};
