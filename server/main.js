// @flow
'use strict';
const config = require('../config');

const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const scrypt = require('scrypt-for-humans');

const invoicing = require('./invoicing');

if (!fs.existsSync('data')) {
  fs.mkdirSync('data');
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    store: new FileStore({
      path: 'sessions',
      ttl: '86400',
    }),
    secret: config.secret,
    httpOnly: true,
    secure: true,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.static('build'));

app.post('/api/login', function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.json({
      error: true,
      message:
        'Missing request parameter(s). Expected json object with username and password keys.',
    });
    return;
  }
  Promise.try(function() {
    return scrypt.verifyHash(
      req.body.password,
      config.users[req.body.username]
    );
  })
    .then(function() {
      req.session.user = req.body.username;
      res.json({
        error: false,
        message: 'Successfully logged in',
      });
    })
    .catch(function(error) {
      res.json({
        error: true,
        message: 'Invalid username+password',
      });
    });
});

app.post('/api/logout', function(req, res) {
  if (req.session.user) {
    req.session.destroy(err => {
      res.json({
        error: false,
        message: 'Logged out!',
      });
    });
  } else {
    res.json({
      error: true,
      message: "Can't log out if not already logged in",
    });
  }
});

app.use('/', (req, res, next) => {
  if (config.users[req.session.user]) {
    next();
  } else {
    res.status(401).json({
      error: true,
      message: 'User is not authenticated',
    });
  }
});

app.use(
  '/api',
  (req, res, next) => {
    if (config.users[req.session.user]) {
      next();
    } else {
      res.status(401).json({
        error: true,
        message: 'User is not authenticated',
      });
    }
  },
  invoicing
);

app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Endpoint not found',
  });
});

// If securePort is defined in config, then we want to enable serving
// over https on that port. Otherwise, the app is probably being served
// from behind a proxy which terminates tls.
if (config.securePort) {
  const httpsServer = https.createServer(
    {
      key: fs.readFileSync(path.resolve(config.tlsKey)),
      cert: fs.readFileSync(path.resolve(config.tlsCert)),
    },
    app
  );
  httpsServer.listen(config.securePort, config.secureHost);
  console.log(`Example app is server via https on port ${config.securePort}.`);
}

app.listen(config.port, config.unsecureHost, function() {
  console.log(`Example app listening on port ${config.port}.`);
});
