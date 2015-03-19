/*
 * logstash.js: Bunyan streaming to Logstash via AMQP
 *
 * (C) 2015 Brandon Hamilton
 * MIT LICENCE
 *
 */

'use strict';

var amqp = require('amqp'),
       _ = require('lodash');

function createLogstashStream(options) {
  return new LogstashStream(options);
}

function LogstashStream(options) {
  options = options || {};

  this.name           = 'bunyan';
  this.host           = options.host     || 'localhost';
  this.port           = options.port     || 5672;
  this.vhost          = options.vhost    || '/';
  this.login          = options.login    || 'guest';
  this.password       = options.password || 'guest';
  this.level          = options.level    || 'info';
  this.server         = options.server   || os.hostname();
  this.application    = options.appName  || process.title;
  this.pid            = options.pid      || process.pid;
  this.tags           = options.tags     || ['bunyan'];
  this.reconnectInterval = options.reconnectInterval || 10000
  this.keepAlive      = options.keepAlive        || true;
  this.type        = options.type;

  this.exchange = (typeof options.exchange == 'object') ? options.exchange : { name: options.exchange };
  if (!this.exchange.name) {
    this.exchange.name = 'bunyan.log';
  }

  if (!this.exchange.properties) {
    this.exchange.properties = {};
  }

  this.connection = amqp.createConnection({ 
    host: this.host,
    port: this.port,
    vhost: this.vhost,
    login: this.login,
    password: this.password
  });

  this.connection.on('error', function(err){
    var self = this;
    switch(err.code) {
      case 320: // CONNECTION_FORCED
      case "ECONNREFUSED":
        // try to reconnect after 10s
        setTimeout(function () {
          self.reconnect();
        }, self.reconnectInterval);
        break;
    }
  });  

}

LogstashStream.prototype.write = function logstashWrite(entry) {
  var level, rec, msg;

  if (typeof(entry) === 'string') {
    entry = JSON.parse(entry);
  }

  rec = _.cloneDeep(entry);

};

module.exports = {
  createStream:   createLogstashStream,
  LogstashStream: LogstashStream
};