module.exports = function() {
  return this._source.close().then(() => (this._type = null, this));
};
