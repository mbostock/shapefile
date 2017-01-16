export default function(value) {
  return value.trim() === '' || isNaN(value = +value) ? null : value;
}
