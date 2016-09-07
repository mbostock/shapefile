function noop() {}

export default function() {
  return Promise.all([
    this._dbf && this._dbf.cancel(),
    this._shp.cancel()
  ]).then(noop);
}
