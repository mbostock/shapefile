export default function(value) {
  return isNaN(value = +value) ? null : value;
}
