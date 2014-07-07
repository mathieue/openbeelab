var cradle = require("cradle");  
var csv = require("fast-csv");
var fs = require("fs");
var es = require("elasticsearch");

var csvStream;

var c = new(cradle.Connection)('http://dev.openbeelab.org', 5984, {
  cache: true
});


function runLamine() {
  console.log("dumping lamine couchdb...");
  csvStream = csv.createWriteStream({headers: true}),
  writableStream = fs.createWriteStream("lamine.csv");
  writableStream.on("finish", function(){
    console.log("writing lamine.csv done ");
    runMeliferopolis();
  });
  csvStream.pipe(writableStream);

  lamine(0);
}

function lamine( skip ) {
  var db = c.database('la_mine');
  db.view('measures/by_date', {limit: 1000, skip: skip, descending: true} , function (err, res) {
    if (typeof res != 'undefined') {
      res.forEach(function (row) {
        process.stdout.write(".");
        csvStream.write({'timestamp': row.timestamp, 'name': row.name ,'value': row.value });
      });

      if (res.length == 0) {
        csvStream.write(null);  
      }
      else {
        lamine(skip + 1000);  
      }
    }
  });
}

function runMeliferopolis() {
  console.log("dumping meliferopolis couchdb...");

  csvStream = csv.createWriteStream({headers: true}),
  writableStream = fs.createWriteStream("meliferopolis.csv");
  writableStream.on("finish", function(){
    console.log("writing meliferopolis.csv done !");
    runMeteowunder();
    });
  csvStream.pipe(writableStream);
  meliferopolis(0);
}

function meliferopolis(skip) {
  var db = c.database('meliferopolis');
  db.view('measures/by_date', {limit: 1000, skip: skip, descending: true} , function (err, res) {
    if (typeof res != 'undefined') {
      res.forEach(function (row) {
        process.stdout.write(".");
        csvStream.write({'timestamp': row.timestamp, 'name': row.name ,'value': row.value });
      });

      if (res.length == 0) {
        csvStream.write(null);  
      }
      else {
        meliferopolis(skip + 1000);  
      }    
    }
  });
}


function runMeteowunder() {
    console.log("dumping meteowunder elasticsearch...");
    csvStream = csv.createWriteStream({headers: true}),
    writableStream = fs.createWriteStream("meteowunderbordeaux.csv");
    writableStream.on("finish", function(){
      console.log("writing meteowunderbordeaux.csv done");
    });
    csvStream.pipe(writableStream);

    meteowunder(0);
}

function meteowunder(from) {
  var client = new es.Client({
    hosts: 'apiopenbeelab.mathieu-elie.net',
    log: 'error'
  });

  client.search({
   index: 'openbeelab',
   type: 'meteowunder',
   body: {
     "size": 100,
     "from": from,
     "sort" : { "timestamp" : "desc" }
   }
  }).then(function (resp) {

    function hourToLocal(hour) {
      hour = hour + 2;
      if (hour == 24) {
        hour = 0;
      }
      if (hour == 25) {
        hour = 1;
      }
      return new Date(hour);
    }

    var hours =  resp.hits.hits;    
    hours.forEach(function(d) {
      var mydate = new Date(d._source.timestamp);
      csvStream.write({
        'timestamp': mydate,
        'temp':d._source.value,
        'hum':d._source.hum,
        'precipm':d._source.precipm,
        'pressurem':d._source.pressurem,
        'wspdm':d._source.wspdm,
        'wdird':d._source.wdird,
        'vism':d._source.vism,
        'conds':d._source.conds,
        'fog':d._source.fog,
        'rain':d._source.rain,
        'snow':d._source.snow,
        'hail':d._source.hail,
        'thunder':d._source.thunder,
        'tornado':d._source.tornado
      });

    });
    
    if (hours.length == 0) {
      csvStream.write(null);
    }
    else {
      meteowunder(from + 100);
    }

  }, function (err) {
        // console.trace(err.message);
   });
}

runLamine();

