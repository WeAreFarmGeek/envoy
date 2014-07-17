_            = require('lodash');
async        = require('async');
request      = require('request-json');
fs           = require('fs');
ejs          = require('ejs');
infiniteLoop = require('infinite-loop');
sys          = require('sys');
exec         = require('child_process').exec;
colors       = require('colors');
winston      = require('winston');

opts = require("nomnom")
          .script('envoy')
          .help('Automatically reconfigure haproxy with consul')
          .option('consul_host', {
            default: 'http://localhost:8500/',
                     abbr:    'h',
                     help:    'The URL of the consul HTTP API'
          })
          .option('log', {
            default: '/var/log/envoy.log',
                     abbr:    'l',
                     help:    'The path to the log file'
          })
          .option('haproxy_destination', {
            default: '/etc/haproxy/haproxy.cfg',
                     abbr:    'o',
                     help:    'Where the resultant haproxy config should be saved'
          })
          .option('haproxy_template', {
            default: __dirname + '/../haproxy_template.cfg.ejs',
                     abbr:    't',
                     help:    'The path to the haproxy template config file'
          })
          .option('poll_interval', {
            default: 30000,
                     abbr:    'p',
                     help:    'The time in miliseconds between each check'
          })
          .parse();

template = "";
backends  = {};

client = request.newClient(opts.consul_host);
winston.add(winston.transports.File, {
  timestamp: true,
  filename: opts.log,
  maxsize: 10000000, // 10MB
  maxFiles: 3,
  json: false
});

function compileHaProxyTemplate() {
  current_config = "";
  async.series([
      function(callback) {
        fs.readFile(opts.haproxy_destination, 'utf8', function (err, data) {
          if (err) {
            winston.error("Couldn't read haproxy config file: " + opts.haproxy_destination);
            data = "";
          }
          callback(null, data);
        });
      },
      function(callback) {
        callback(null, ejs.render(template, {
          backends: backends,
          services: _.keys(backends)
        }));
      }
  ],
  function(err, results) {
    if (!(results[0] === results[1])) {
      winston.info("Changes detected");
      writeConfig(results[1]);
    } else {
      winston.info("No changes detected");
    }
  });
}

function triggerHaproxyReload() {
  exec("sudo service haproxy reload", function(err, stdout, stderr){
    if (err) return winston.error(err);
    if (stderr) return winston.error(stderr);
    winston.info("Updated config and reloaded haproxy");
  });
}

function writeConfig(config_file) {
  fs.writeFile(opts.haproxy_destination, config_file, function(err){
    if (err) return winston.error(err);
    triggerHaproxyReload();
  });
}


function getIpsForService(service, callback) {
  backends[service] = [];

  client.get('/v1/health/service/' + service + "?passing", function(err, res, body) {
    if (err) return winston.error(err);

    async.each(body, function(s, callback) {
      backends[service].push({
        ip:   s["Node"]["Address"],
        port: s["Service"]["Port"],
        node: s['Node']["Node"]
      });

      callback();
    }, function(err) {
      if (err) return winston.error(err);
      callback();
    });
  });
}


function main() {
  winston.info("Checking for changes");
  // Read template configuration
  fs.readFile(opts.haproxy_template, 'utf8', function (err, data) {
    if (err) return winston.error("Couldn't load template file: " + opts.haproxy_template);
    template = data;
  });

  // Retrieve a list of backends and begin to build a configuration
  client.get('/v1/catalog/services', function(err, res, body) {
    var service_list = _.keys(body);
    async.eachSeries(service_list, getIpsForService, function(err) {
      if (err) return winston.error(err);
      compileHaProxyTemplate();
    });
  });
}


function run() {
  // Start App in an infinite loop
  winston.info("Started Envoy");
  main();
  var il = new infiniteLoop;
  il.add(main).setInterval(opts.poll_interval).run()
}

exports.run = run;
