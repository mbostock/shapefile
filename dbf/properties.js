export default function(fields) {
  return new Function("d", `return {${fields.map((f, i) => `${JSON.stringify(f.name)}:d[${i}]`)}};`);
}
