const express = require('express');
const router = express.Router();
const fs = require('fs');
const store = require('jsonfile');

const testDatasetName = dataset => /^[-\w]+$/.test(dataset);

const updateDataset = (dataset, update, callback) => {
  const filepath = `./data/${dataset}.json`;
  store.readFile(filepath, function(err, data) {
    if (err) {
      if (err.code === 'ENOENT') {
        callback({ error: 404, message: "Dataset doesn't exist" });
      } else {
        callback({
          error: 500,
          message: 'Something went wrong opening this dataset',
        });
      }
    } else {
      const newData = update(data);
      store.writeFile(filepath, newData, function(err) {
        if (err) {
          console.log(err);
          callback({
            error: 500,
            message: 'Failed to write dataset',
          });
          return;
        }
        callback(undefined, {
          data: newData,
        });
      });
    }
  });
};

router.get('/dataset-list', (req, res) => {
  fs.readdir('./data', (err, files) => {
    if (err) {
      console.log(err);
      res.status(500).json({
        error: true,
        message: 'Failed to get dataset list.',
      });
      return;
    }
    files.forEach(file => {
      console.log(file);
    });
    const fileFilter = /^(.+)\.json$/;
    const list = files.reduce((list, name) => {
      const [, filename] = fileFilter.exec(name) || [null, null];
      if (filename) {
        return list.concat(filename);
      }
      return list;
    }, []);
    res.json({
      list,
    });
  });
});

router.get('/:dataset', (req, res) => {
  const dataset = req.params.dataset.trim();
  if (!testDatasetName(dataset)) {
    res.status(400).json({
      error: true,
      message:
        'Not a valid dataset name. Names must be letters, numbers, "-" and "_".',
    });
    return;
  }
  store.readFile(`./data/${dataset}.json`, function(err, data) {
    if (err) {
      if (err.code === 'ENOENT') {
        res.status(404).json({
          error: true,
          message: "Dataset doesn't exist",
        });
      } else {
        res.status(500).json({
          error: true,
          message: 'Something went wrong opening this dataset',
        });
      }
    } else {
      res.json({
        dataset: data,
      });
    }
  });
});

router.post(
  '/dataset',
  (req, res, next) => {
    req.dataset = req.body.dataset;
    if (!req.dataset || !testDatasetName(req.dataset)) {
      res.status(400).json({
        error: true,
        message:
          'Not a valid dataset name. Names must be letters, numbers, "-" and "_".',
      });
      return;
    }
    store.readFile(`./data/${req.dataset}.json`, function(err) {
      if (err) {
        if (err.code === 'ENOENT') {
          next();
        } else {
          res.status(500).json({
            error: true,
            message: 'Something went wrong, this dataset may already exist',
          });
        }
      } else {
        res.status(200).json({
          error: true,
          message: 'This dataset already exist',
        });
      }
    });
  },
  (req, res) => {
    store.writeFile(
      `./data/${req.dataset}.json`,
      { invoices: [], payments: [] },
      function(err) {
        if (err) {
          res.sendStatus(500);
          res.end('Failed to write new dataset');
          console.log(err);
          return;
        }
        res.status(200).json({
          error: false,
          message: 'Created new dataset',
        });
      }
    );
  }
);

router.post('/:dataset/add-invoice', (req, res) => {
  const dataset = req.params.dataset.trim();
  if (!testDatasetName(dataset)) {
    res.status(400).json({
      error: true,
      message:
        'Not a valid dataset name. Names must be letters, numbers, "-" and "_".',
    });
    return;
  }

  if (
    !req.body.invoice ||
    !req.body.invoice.number ||
    !req.body.invoice.amount ||
    !req.body.invoice.date
  ) {
    res.status(400).json({
      error: true,
      message: 'Not a valid invoice',
    });
    return;
  }
  const invoice = req.body.invoice;

  updateDataset(
    dataset,
    data => Object.assign(data, { invoices: data.invoices.concat(invoice) }),
    err => {
      if (err) {
        res.status(err.error).json({
          error: true,
          message: err.message,
        });
      } else {
        res.json({
          error: false,
          message: 'Added invoice to dataset',
        });
      }
    }
  );
});

router.post('/:dataset/add-payment', (req, res) => {
  const dataset = req.params.dataset.trim();
  if (!testDatasetName(dataset)) {
    res.status(400).json({
      error: true,
      message:
        'Not a valid dataset name. Names must be letters, numbers, "-" and "_".',
    });
    return;
  }

  if (!req.body.payment || !req.body.payment.amount || !req.body.payment.date) {
    res.status(400).json({
      error: true,
      message: 'Not a valid payment',
    });
    return;
  }
  const payment = req.body.payment;
  if (!payment.comment) {
    payment.comment = '';
  }

  updateDataset(
    dataset,
    data => Object.assign(data, { payments: data.payments.concat(payment) }),
    err => {
      if (err) {
        res.status(err.error).json({
          error: true,
          message: err.message,
        });
      } else {
        res.json({
          error: false,
          message: 'Added payment to dataset',
        });
      }
    }
  );
});

module.exports = router;
