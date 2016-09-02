module.exports = function(d) {
  return isNaN(d = +d) ? null : d;
};
