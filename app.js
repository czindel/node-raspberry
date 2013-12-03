
var express = require('express');
var http = require('http');
var path = require('path');
var gpio = require('./gpio_export');
var EventEmitter = require('events').EventEmitter; 
var i2c = require('i2c');


var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));


var server = http.createServer(app)
var io = require('socket.io').listen(server);

io.set('log level', 1);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
  initGpio();
  initI2c();
});

var routes = require('./routes/index');

app.get('/', routes.index);

var gpioEmitter = new EventEmitter();

io.sockets.on('connection', function (socket) {
  gpioEmitter.on('buttonPress', function(data){
    socket.emit('news', data);
  });
});



function initGpio()
{
//  var button = gpio.p23_in;
  var led = gpio.p17_out;
  led.writeSync(1);
/*  var count = 0;


  button.watch(function (err, value) {
    if (err) throw err;

    console.log('Button pressed!, its value was ' + value + ' - '+(count++));

    var state = led.readSync() ? 0 : 1;

    gpioEmitter.emit('buttonPress', { state: state });

    led.writeSync(state);
  });*/
}


function initI2c()
{
  var expander = new i2c(0x38, {device: '/dev/i2c-1'});
/*  var wire = new i2c();

  wire.scan(function(err, data) {
//    console.log('wire.scan 0x', data[0].toString(16));
    console.log('wire.scan ', data);
  });*/

  //wire.writeByte(0x01, function(err) {});

  var eCount = 0;
  var offset = 1;

  var i = setInterval(function(){

    var invert = Math.pow(2, eCount) ^ 0xff;

    eCount += offset;
    expander.writeByte(invert, function(err) {});

    if( eCount == 7 )
    {
      offset = -1;
    }

    if( eCount == 0 )
    {
      offset = 1;
    }    
  }, 40);
}

