export default function(result) {
  return new DataView(result.value.buffer, result.value.byteOffset, result.value.byteLength);
}
