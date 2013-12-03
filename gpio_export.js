var Gpio = require('onoff').Gpio;

exports.p23_in = new Gpio(23, 'in', 'rising', {
    persistentWatch : true,
    debounceTimeout : 100
  });
exports.p27_out = new Gpio(27, 'out');