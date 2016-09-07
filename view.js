export default function(array) {
  return new DataView(array.buffer, array.byteOffset, array.byteLength);
}
