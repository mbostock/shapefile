module.exports = function() {
  return this._file.close().then(() => (this._type = null, this));
};
