module.exports = function(path) {
  return this._source.open(path).then(() => this);
};
