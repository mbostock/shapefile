module.exports = function(d) {
  return new Date(+d.substring(0, 4), d.substring(4, 6) - 1, +d.substring(6, 8));
};
