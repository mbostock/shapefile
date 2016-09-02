module.exports = function() {
  return this._file.close().then(() => (this._version = this._date = this._length = this._recordLength = null, this._fields = [], this));
};
