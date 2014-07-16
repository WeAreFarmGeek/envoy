opts = require("nomnom")
	.script('envoy')
	.help('Automatically reconfigure haproxy with consul')
	.option('consul_host', {
		default: 'http://localhost:3000/',
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

module.opts = opts;
