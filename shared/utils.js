const generate_guid = (length = 5) => {
  let _length = length;

  if (_length < 5) {
    _length = 5;
  } else if (_length > 10) {
    _length = 10;
  }

  return Math.random().toString(36).slice(-_length);
}

module.exports = {
  generate_guid,
};
