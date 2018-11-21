
export default function(record) {
  return {type: "PointZ", coordinates: [record.getFloat64(4, true), record.getFloat64(12, true), record.getFloat64(20, true)]};
};
