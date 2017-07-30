export default function(a, b) {
  var ab = new a.constructor(a.length + b.length);
  ab.set(a, 0);
  ab.set(b, a.length);
  return ab;
}
