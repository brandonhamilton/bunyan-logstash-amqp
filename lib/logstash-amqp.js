/*
 * logstash.js: Bunyan streaming to Logstash via AMQP
 *
 * (C) 2015 Brandon Hamilton
 * MIT LICENCE
 *
 */

'use strict';

var     bunyan = require('bunyan'),
          amqp = require('amqp'),
            os = require('os'),
       CBuffer = require('CBuffer'),
             _ = require('lodash'),
          util = require('util'),
  EventEmitter = require('events').EventEmitter;

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
  EventEmitter.call(this);
  options = options || {};

  this.name              = 'bunyan';
  this.host              = options.host     || 'localhost';
  this.port              = options.port     || 5672;
  this.vhost             = options.vhost    || '/';
  this.login             = options.login     || 'guest';
  this.password          = options.password || 'guest';
  this.level             = options.level    || 'info';
  this.server            = options.server   || os.hostname();
  this.application       = options.application || process.title;
  this.pid               = options.pid      || process.pid;
  this.tags              = options.tags     || ['bunyan'];
  this.type              = options.type;
  this.cbufferSize       = options.bufferSize  || 100;
  this.sslEnable         = options.sslEnable   || false;
  this.sslKey            = options.sslKey      || '';
  this.sslCert           = options.sslCert     || '';
  this.sslCA             = options.sslCA       || '';
  this.sslRejectUnauthorized = options.sslRejectUnauthorized || true;
  this.messageFormatter  = options.messageFormatter;
  
  this.exchange = (typeof options.exchange == 'object') ? options.exchange : { name: options.exchange };

  if (!this.exchange.properties) {
    this.exchange.properties = {};
  }

  this.log_buffer  = new CBuffer(this.cbufferSize);
  this.connected   = false;

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
  this.connection.on('error', self.emit);

  this.connection.on('ready', function(){
    var exchange = self.connection.exchange(self.exchange.name, self.exchange.properties, function (exchange) {
      self._exchange = exchange;    
      self.connected = true;    
      self.emit('connect');
      self.flush();
    });
  });

  this.connection.on('close', function(){
    self._exchange = null;
    self.connected = false;
    self.emit('close');
  }); 
}
util.inherits(LogstashStream, EventEmitter);

LogstashStream.prototype.flush = function () {
  var self = this;

  var message = self.log_buffer.pop();
  while(message){
    self.sendLog(message.message);
    message = self.log_buffer.pop();
  }

  self.log_buffer.empty();
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

  if (this.messageFormatter) {
      msg = this.messageFormatter(msg);
  }
  
  delete rec.time;
  delete rec.msg;
  delete rec.v;
  delete rec.level;

  rec.pid = this.pid;

  this.send( this.exchange.routingKey || level, JSON.stringify(_.extend({}, msg, rec), bunyan.safeCycles()));
};

LogstashStream.prototype.flush = function () {
  var message = this.log_buffer.pop();
  while(message){
    this.sendLog(message.routingKey, message.message);
    message = this.log_buffer.pop();
  }
  this.log_buffer.empty();
};

LogstashStream.prototype.sendLog = function (routingKey, message) {
  if (this._exchange) {
    this._exchange.publish(routingKey, message);
  } else {
    this.log_buffer.push({ routingKey: routingKey, message: message });
  }
};

LogstashStream.prototype.send = function logstashSend(routingKey, message) {
  if (!this.connected) {
    this.log_buffer.push({ routingKey: routingKey, message: message });
  } else {
    this.sendLog(routingKey, message);
  }
};

module.exports = {
  createStream:   createLogstashStream,
  LogstashStream: LogstashStream
};
