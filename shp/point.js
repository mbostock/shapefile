export default function(record) {
  return {shapeType: 1, x: record.getFloat64(4, true), y: record.getFloat64(12, true)};
};
