# Logstash AMQP stream for Bunyan

[![Build Status](https://travis-ci.org/brandonhamilton/bunyan-logstash-amqp.svg)](https://travis-ci.org/brandonhamilton/bunyan-logstash-amqp)

Logstash stream via AMQP for the Bunyan logger

An AMQP logger for [Logstash](http://logstash.net/docs/1.4.2/inputs/rabbitmq)

# Installation

    $ npm install bunyan-logstash-amqp


## Usage

```javascript
"use strict";

var bunyan = require('bunyan');

var amqp_stream = require('bunyan-logstash-amqp').createStream({
    vhost: "logging",
    exchange: {
        routingKey: 'logs'
    }})
.on('connect', function() { console.log("Connected to amqp"); })
.on('close', function() { console.log("Closed connection to amqp"); })
.on('error', console.log );

var log = bunyan.createLogger({
    name: 'example',
    streams: [{
        level: 'debug',
        stream: process.stdout
    },{
        level: 'debug',
        type: "raw",
        stream: amqp_stream
    }],
    level: 'debug'
});
```

## Configuration

A raw bunyan stream can be created using the module  ``createStream(options)``method.

The ``options`` object accepts the following fields:

<table>
  <tr>
    <th>Parameter</th><th>Type</th><th>Default</th><th>Description</th>
  </tr>
  <tr>
    <th>host</th>
    <td>string</td>
    <td><code>localhost</code></td>
    <td>AMQP host</td>
  </tr>
  <tr>
    <th>port</th>
    <td>number</td>
    <td><code>5672</code></td>
    <td>AMQP port</td>
  </tr>
  <tr>
    <th>vhost</th>
    <td>string</td>
    <td><code>/</code></td>
    <td>AMQP virtual host</td>
  </tr>
  <tr>
    <th>login</th>
    <td>string</td>
    <td><code>guest</code></td>
    <td>AMQP username</td>
  </tr>
  <tr>
    <th>password</th>
    <td>string</td>
    <td><code>guest</code></td>
    <td>AMQP password</td>
  </tr>
  <tr>
    <th>sslEnable</th>
    <td>boolean</td>
    <td><code>false</code></td>
    <td>Enable AMQP SSL</td>
  </tr>
  <tr>
    <th>sslKey</th>
    <td>string</td>
    <td><code>''</code></td>
    <td>AMQP SSL private key file path</td>
  </tr>
  <tr>
    <th>sslCert</th>
    <td>string</td>
    <td><code>''</code></td>
    <td>AMQP SSL certificate file path</td>
  </tr>
  <tr>
    <th>sslCA</th>
    <td>string</td>
    <td><code>''</code></td>
    <td>AMQP SSL CA file path</td>
  </tr>
  <tr>
    <th>sslRejectUnauthorized</th>
    <td>boolean</td>
    <td><code>true</code></td>
    <td>Verify AMQP SSL certificate against CA</td>
  </tr>
  <tr>
    <th>exchange</th>
    <td>object</td>
    <td><code>undefined</code></td>
    <td>AMQP exchange options</td>
  </tr>
  <tr>
    <th>level</th>
    <td>string</td>
    <td><code>info</code></td>
    <td>Logstash message level</td>
  </tr>
  <tr>
    <th>server</th>
    <td>string</td>
    <td><code>os.hostname()</code></td>
    <td>Logstash message source server</td>
  </tr>
  <tr>
    <th>application</th>
    <td>string</td>
    <td><code>process.title</code></td>
    <td>Logstash message source application</td>
  </tr>
  <tr>
    <th>pid</th>
    <td>string</td>
    <td><code>process.pid</code></td>
    <td>Logstash message pid</td>
  </tr>
  <tr>
    <th>tags</th>
    <td>string array</td>
    <td><code>["bunyan"]</code></td>
    <td>Logstash message tags</td>
  </tr>
  <tr>
    <th>type</th>
    <td>string</td>
    <td><code>undefined</code></td>
    <td>Logstash message type</td>
  </tr>
  <tr>
    <th>bufferSize</th>
    <td>number</td>
    <td><code>100</code></td>
    <td>Outstanding message buffer size</td>
  </tr>
  <tr>
    <th>messageFormatter</th>
    <td>function</td>
    <td><code>undefined</code></td>
    <td>Optional message formatting function</td>
  </tr>
</table>

The **exchange** object accepts the following fields:
<table>
  <tr>
    <th>Parameter</th><th>Type</th><th>Default</th><th>Description</th>
  </tr>
  <tr>
    <th>name</th>
    <td>string</td>
    <td><code>undefined</code></td>
    <td>AMQP exchange name</td>
  </tr>
  <tr>
    <th>routingKey</th>
    <td>string</td>
    <td><code>message.level</code></td>
    <td>AMQP message routing key</td>
  </tr>
  <tr>
    <th>properties</th>
    <td>object</td>
    <td><code>{}</code></td>
    <td><a href="https://github.com/postwait/node-amqp/blob/master/README.md#connectionexchangename-options-opencallback" target="_blank">AMQP exchange options</a></td>
  </tr>
</table>

### Events

The stream will emit ``open``, ``close`` and ``error`` events from the underlying AMQP connection.


## Credits

This module is heavily based on [bunyan-logstash-tcp](https://github.com/chris-rock/bunyan-logstash-tcp.git).

## License

The MIT License (MIT)

Copyright (c) 2015 Brandon Hamilton

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
