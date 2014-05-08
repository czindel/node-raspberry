var Gpio = require('onoff').Gpio;

exports.p22_in  = new Gpio(22, 'in', 'falling');
exports.p18_in  = new Gpio(18, 'in', 'falling');

exports.p17_out = new Gpio(17, 'out');