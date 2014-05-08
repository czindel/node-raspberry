
var express = require('express');
var http = require('http');
var path = require('path');
var gpio = require('./gpio_export');
var EventEmitter = require('events').EventEmitter; 
var i2c = require('i2c');
var _ = require('underscore');
var SPI = require('spi');


var app = express();


app.set('port', process.env.PORT || 3000);
//	app.set('views', __dirname + '/views');
//	app.set('view engine', 'hjs');
//	app.use(express.favicon());
//app.use(express.bodyParser());
//	app.use(express.methodOverride());
//	app.use(app.router);
//	app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public'))); 

app.get('/', function(req, res){
  res.send('hello world');
}); 


var server = http.createServer(app)
//var io = require('socket.io').listen(server);

//io.set('log level', 1);

server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
	
	initGpio();
	initI2c();
	initSpi();
});

app.get('/', function(req, res){
  res.render('index', { title: 'Express' });
});

var gpioEmitter = new EventEmitter();

/*io.sockets.on('connection', function (socket) {
	gpioEmitter.on('buttonPress', function(data){
		socket.emit('news', data);
	});
});*/

process.on('SIGINT', function(){
	gpio.p17_out.writeSync(0)
	console.log(' -- EXIT -- ');

	process.exit();
});


function initGpio()
{
	var button = gpio.p22_in;
	var waterSwitch = gpio.p18_in;
	var led = gpio.p17_out;
	led.writeSync(1);

	var last, diff = 0.0, current;
	button.watch(_.debounce(function(err, value) {
		
		if( err ) throw err;

		if( last )
		{
			var diff = process.hrtime(last);
			console.log(value, diff[0] + diff[1]/1e9);
		}
		else{
			console.log(0);
		}

		last = process.hrtime();
		
		gpioEmitter.emit('buttonPress', { value: value, time: process.hrtime()});		

	}), 50, true);

	waterSwitch.watch(_.debounce(function(err, value) {
		
		console.log('waterSwitch')

		if( err ) throw err;

		if( last )
		{
			var diff = process.hrtime(last);
			console.log(value, diff[0] + diff[1]/1e9);
		}
		else{
			console.log(0);
		}

		last = process.hrtime();
		
		gpioEmitter.emit('buttonPress', { value: value, time: process.hrtime()});		

	}), 50, true);
}


function initI2c()
{
	var TSL2561  = new i2c(0x29, {device: '/dev/i2c-1'}); // light sensor
	var PFC8574  = new i2c(0x38, {device: '/dev/i2c-1'}); // expander
	var SSD1306  = new i2c(0x3c, {device: '/dev/i2c-1'}); // oled display
	var ADS1015  = new i2c(0x48, {device: '/dev/i2c-1'}); // A/D converter
	var MPL115A2 = new i2c(0x60, {device: '/dev/i2c-1'}); // pressure/temperature sensor
	
	var wire = new i2c();
	wire.scan(function(err, data) {
		
		data = _.map(data, function(item){
			return '0x'+item.toString(16);
		});

		console.log('wire.scan ', data);
	});


	/*MPL115A2.readBytes(0x04, 1, function(err, res) {
		console.log('1of1', res[0])
	});*/

	MPL115A2.readBytes(0x00, 12, function(err, res) {

		//console.log(res.readUInt16BE(0));
		//console.log(res.readUInt16BE(0));
		var padc = res.readUInt16BE(0);
		var tadc = res.readUInt16BE(2);
		var a0 = res.readUInt16BE(4);
		var b1 = res.readUInt16BE(6);
		var b2 = res.readUInt16BE(8);
		var c12 = res.readUInt16BE(10);

	});


	var eCount = 0;
	var offset = 1;

	setInterval(function(){

		var invert = Math.pow(2, eCount) ^ 0xff;

		eCount += offset;
		PFC8574.writeByte(invert, function(err) {});

		if( eCount == 7 )
		{
			offset = -1;
		}

		if( eCount == 0 )
		{
			offset = 1;
		}    
	}, 500);


}

function initSpi()
{
	var spi = new SPI.Spi('/dev/spidev0.0', {
    	'mode': SPI.MODE['MODE_0'],  // always set mode as the first option
    	'chipSelect': SPI.CS['none'] // 'none', 'high' - defaults to low
	}, function(s){
		s.open();

		readSpi(s);


	});
}

function readSpi(s){

	setInterval(function(){

		var txbuf = new Buffer([ 1, 0x80, 0]);
		var rxbuf = new Buffer([ 0, 0, 0]);

		s.transfer(txbuf, rxbuf, function(device, buf) {
			console.log(device)
			var bin = "";
			var hex = "";

			for (var i=0; i < buf.length; i++)
			{
				//console.log(buf[i]);
				bin += buf[i].toString(2) + " ";
				hex += '0x'+buf[i].toString(16) + " ";
			}

			console.log(((buf[1]&3) << 8) + buf[2])
		        
			//console.log(bin);
			console.log(hex);
		});

	}, 2000)
}

