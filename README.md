# Invoicing
This is a simple app to handle invoices and payments. You have datasets where you can add invoices with an amount, date, and comment, and add payments with amount, date, and comments. It shows a list of the invoices and payments, as well as running balance.

For now, you need to create the dataset JSON files in the /data folder, with a structure of `{"invoices":[], "payments": []}`. Adding new datasets programmatically is a planned feature. The dataset names are the file name without `.json`. So for dataset `foo`, there should be a corresponding file `/data/foo.json`.

## Running the app
To install dependencies, run `npm install`.

You need to create file as described below.

The app can then be run with `npm start`.

To build the front end app, use `npm run build` for production, `npm run build-dev` to watch for changes and build in development mode, and `npm run dev` to start webpack-dev-server (which is set to proxy to the app server, based on the config file).

## Config file
Create `/config.js`, with content like:
```js
module.exports = {
  // You can generate a secure random secret in a linux terminal with `cat /dev/urandom | env LC_CTYPE=C tr -dc _A-Za-z0-9 | head -c${1:-64}`
  secret: 'random generated session secret',
  port: 1337,
  unsecureHost: 'localhost',
  // HTTPS config
  // For development, you can generate a self-signed cert using:
  // `openssl req -x509 -newkey rsa:2048 -sha256 -nodes -keyout key.pem -out cert.pem -days 365`.
  // For production, you can use the free https://letsencrypt.org/ service to obtain a cert and key file,
  // or get them from other services.
  // If you don't define securePort, the app will be served over http only, but you could also provide
  // tls/https by using a proxy server. This is actually recommended by some.
  securePort: 1338,
  secureHost: 'localhost',
  tlsKey: 'ssl/key.pem',
  tlsCert: 'ssl/cert.pem',
  users: {
    // username and password combo for login.
    // Generate with `require('scrypt-for-humans').hash('your password').then(hash => console.log(hash)).catch(e => console.log(e));`
    // in a node repl (with the script-for-humans package installed).
    sams: 'password hash starting with c2NyeXB0AA4AAAAIAAAAA or similar',
  },
};
```
