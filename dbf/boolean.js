module.exports = function(d) {
  return /^[nf]$/i.test(d) ? false
      : /^[yt]$/i.test(d) ? true
      : null;
};
