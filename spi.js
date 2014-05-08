
var SPI = require('spi');


var spi = new SPI.Spi('/dev/spidev0.0', {
	'mode': SPI.MODE['MODE_0'],  // always set mode as the first option
	'chipSelect': SPI.CS['low'] // 'none', 'high' - defaults to low
}, function(s){
	s.open();

	readSpi(s);

});


function readSpi(s){

	setInterval(function(){

		var txbuf = new Buffer([ 1, 0x80, 0]);
		var rxbuf = new Buffer([ 0, 0, 0]);

		s.transfer(txbuf, rxbuf, function(device, buf) {
			// console.log(device)
			var bin = "";
			var hex = "";

			for (var i=0; i < buf.length; i++)
			{
				//console.log(buf[i]);
				bin += buf[i].toString(2) + " ";
				hex += '0x'+buf[i].toString(16) + " ";
			}

			var sample = ((buf[1]&3) << 8) + buf[2]

			console.log(sample, sample/1023, (sample/1023)*3.3);
		        
			//console.log(bin);
			// console.log(hex);
		});

	}, 500)
}

