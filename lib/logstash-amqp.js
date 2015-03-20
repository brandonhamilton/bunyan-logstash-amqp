/*
 * logstash.js: Bunyan streaming to Logstash via AMQP
 *
 * (C) 2015 Brandon Hamilton
 * MIT LICENCE
 *
 */

'use strict';

var bunyan = require('bunyan'),
      amqp = require('amqp'),
        os = require('os'),
   CBuffer = require('CBuffer'),
         _ = require('lodash');

var levels = {
  10: 'trace',
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'fatal'
};

function createLogstashStream(options) {
  return new LogstashStream(options);
}

function LogstashStream(options) {
  options = options || {};

  this.name              = 'bunyan';
  this.host              = options.host     || 'localhost';
  this.port              = options.port     || 5672;
  this.vhost             = options.vhost    || '/';
  this.login             = options.login    || 'guest';
  this.password          = options.password || 'guest';
  this.level             = options.level    || 'info';
  this.server            = options.server   || os.hostname();
  this.application       = options.appName  || process.title;
  this.pid               = options.pid      || process.pid;
  this.tags              = options.tags     || ['bunyan'];
  this.reconnectInterval = options.reconnectInterval || 10000
  this.keepAlive         = options.keepAlive         || true;
  this.type              = options.type;
  this.cbufferSize       = options.cbufferSize || 10;
  this.sslEnable         = options.sslEnable   || false;
  this.sslKey            = options.sslKey      || '';
  this.sslCert           = options.sslCert     || '';
  this.sslCA             = options.sslCA       || '';
  this.sslRejectUnauthorized = options.sslRejectUnauthorized || true;

  this.exchange = (typeof options.exchange == 'object') ? options.exchange : { name: options.exchange };
  if (!this.exchange.name) {
    this.exchange.name = 'bunyan.log';
  }

  if (!this.exchange.properties) {
    this.exchange.properties = {};
  }

  this.log_queue  = new CBuffer(this.cbufferSize);
  this.state             = 'closed';

  var self = this;

  var connection_options = { 
    host: this.host,
    port: this.port,
    vhost: this.vhost,
    login: this.login,
    password: this.password
  }

  if (this.sslEnable) {
    connection_options['ssl'] = {
      enabled  : true, 
      keyFile  : this.sslKey, 
      certFile : this.sslCert, 
      caFile   : this.sslCA, 
      rejectUnauthorized : sslRejectUnauthorized.sslKey 
    }
  }
  this.connection = amqp.createConnection(connection_options);

  this.connection.on('error', function(err){
    console.log(err.code + ': ' + err);
    switch(err.code) {
      case 320: // CONNECTION_FORCED
      case "ECONNREFUSED":
        console.log('NO RABBITMQ CONN');
        // try to reconnect after 10s
        setTimeout(function () {
          self.reconnect();
        }, self.reconnectInterval);
        break;
    }
  });  

  this.connection.on('ready', function(){
    var exchange = self.connection.exchange(self.exchange.name, self.exchange.properties);
    exchange.on('open', function () {
      console.log('Exchange \"' + exchange.name + '\" is open');
      flushPending(null, exchange);
    });
  });  

  this.connection.on('close', function(){
    console.log("closed");
  }); 
}

LogstashStream.prototype.flush = function () {
  var self = this;

  var message = self.log_queue.pop();
  while(message){
    self.sendLog(message.message);
    message = self.log_queue.pop();
  }

  self.log_queue.empty();
};

LogstashStream.prototype.write = function logstashWrite(entry) {
  var level, rec, msg;

  if (typeof(entry) === 'string') {
    entry = JSON.parse(entry);
  }

  rec = _.cloneDeep(entry);

  level = rec.level;

  if (levels.hasOwnProperty(level)) {
    level = levels[level];
  }

  msg = {
    '@timestamp': rec.time.toISOString(),
    'message':    rec.msg,
    'tags':       this.tags,
    'source':     this.server + '/' + this.application,
    'level':      level
  };

  if (typeof(this.type) === 'string') {
    msg['type'] = this.type;
  }

  delete rec.time;
  delete rec.msg;

  // Remove internal bunyan fields that won't mean anything outside of
  // a bunyan context.
  delete rec.v;
  delete rec.level;

  rec.pid = this.pid;

  this.send(JSON.stringify(_.extend({}, msg, rec), bunyan.safeCycles()));
};

LogstashStream.prototype.flush = function () {
  var message = this.log_queue.pop();
  while(message){
    this.sendLog(message.message);
    message = this.log_queue.pop();
  }
  this.log_queue.empty();
};

LogstashStream.prototype.sendLog = function (message) {
  this.socket.write(message + '\n');
};

LogstashStream.prototype.send = function logstashSend(message) {
  if (!this.connected) {
    this.log_queue.push({ message: message });
  } else {
    this.sendLog(message);
  }
};

module.exports = {
  createStream:   createLogstashStream,
  LogstashStream: LogstashStream
};