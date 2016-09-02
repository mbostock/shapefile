module.exports = function() {
  return this._file.close().then(() => (this._recordLength = null, this._fields = [], this));
};
