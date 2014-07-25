# Envoy

Sync your consul services with your haproxy balancer
![Envoy](http://i.imgur.com/UHRG7Ex.jpg)

## FAQ

### What's Envoy for?

Envoy allows Consul to tell HAProxy which nodes are available without manually changing the configuration. This allows you to spawn new server instances with zero config of your load balancer.

### Why Node.JS?

We wanted to build a small, hackable script that would get the job done internally, and allow anyone to jump in and fix it if there's a problem. There's a lot of room for improvement, but we're confident we can make Envoy really amazing as we continue to use it in production.

### Why not [Serf?](http://www.serfdom.io/)

[See here](http://www.serfdom.io/intro/vs-consul.html) - Serf may be a better option for you! If you're still here, then you'll know why you need Envoy.

### How do I install Consul?

[See here](http://www.consul.io/intro/). I managed to roll it out on my production machines with the help of [Ansible](http://ansible.com) in one working day.

## Installation

On your server:

    git clone https://github.com/WeAreFarmGeek/envoy.git
    cd envoy
    npm install --production
    bin/envoy --help

## Usage

[The most up to date place to read about the API is here.](https://github.com/WeAreFarmGeek/envoy)

Use the example configuration as a template to customise for your own needs. Envoy works by compiling a configuration file and checking against what you currently have to determine if something's changed. This means that if you're using Envoy for the first time, it's a good idea to use the `-o` flag to send the configuration output to somewhere *other* than the real HAProxy config file, so that you don't break your existing configuration.

You can see all the different options available by running `envoy --usage`.

[There is a blog post about using Envoy here](http://johnhamelink.com/distributed-web-systems-with-consul-haproxy-and-envoy.html), which may be of use if you get stuck, otherwise feel free to make an issue and we'll clarify further!

## Todo

 - Split up lib/envoy.js into smaller chunks
 - Add an envoy configuration file with sensible defaults
 - Add filters for backends, as well as a way of defining options (like TCP mode) for individual backends
