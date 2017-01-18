export default function(value) {
  return !(value = value.trim()) || isNaN(value = +value) ? null : value;
}
