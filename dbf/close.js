module.exports = function() {
  return this._source.close().then(() => (this._recordLength = null, this._fields = [], this));
};
