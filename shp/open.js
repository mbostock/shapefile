module.exports = function(path) {
  return this._file.open(path).then(() => this);
};
