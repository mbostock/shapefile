export default function(record) {
  return {type: "Point", coordinates: [record.getFloat64(4, true), record.getFloat64(12, true)]};
};
