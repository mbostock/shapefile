export default function(fields) {
  return new Function("d", "return {"
      + fields.map(function(field, i) { return JSON.stringify(field.name) + ":d[" + i + "]"; })
      + "};");
}
