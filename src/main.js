import 'babel-polyfill';
import { render as infernoRender, createVNode, createComponentVNode } from 'inferno/dist/inferno.js';
import createStore from '@samsch/subscribe-store';
import Promise from 'bluebird';
import moment from 'moment';
import Invoicing from './Invoicing';

const api = (endpoint, body) => {
  return Promise.try(() => {
    const headers = new Headers();
    if (body != null) {
      headers.append('Content-Type', 'application/json');
    }
    headers.append('Accept', 'application/json');

    return fetch(`/api/${endpoint}`, {
      method: body ? 'POST' : 'GET',
      mode: 'same-origin',
      redirect: 'follow',
      credentials: 'same-origin',
      body: body == null ? undefined : JSON.stringify(body),
      headers,
    })
      .catch(error => {
        console.log('Network error', error);
        throw new Error('Network error');
      })
      .then(res => {
        return res.json().then(data => ({
          res,
          data,
        }));
      });
  });
};

const messagesStore = createStore({
  messages: [],
});

const store = createStore({
  datasetList: [],
  dataset: '',
  data: null,
  loading: false,
  username: '',
  password: '',
  invNum: '',
  invDate: '',
  invAmount: '',
  payComment: '',
  payDate: '',
  payAmount: '',
});

window.store = store;
window.messagesStore = messagesStore;

const addMessage = (message, type = 'success') => {
  messagesStore.updateState(prev => {
    const messageObj = {
      message,
      type,
    };
    return {
      messages:
        prev.messages.length > 5
          ? [...prev.messages.slice(1), messageObj]
          : prev.messages.concat(messageObj),
    };
  });
};

const addError = message => addMessage(message, 'error');

const refreshDatasetList = () => {
  return api('dataset-list?').then(({ res, data }) => {
    if (res.status === 200 && !data.error) {
      store.updateState({
        datasetList: data.list,
      });
    } else {
      addError('Failed to load list of datasets');
    }
  });
};
const updateUsername = username => {
  store.updateState({ username });
};
const updatePassword = password => {
  store.updateState({ password });
};
const updateField = (field, value) => {
  store.updateState({ [field]: value });
};
const login = () => {
  api('login', {
    username: store.state.username,
    password: store.state.password,
  })
    .then(({ res, data }) => {
      if (res.status === 200 && !data.error) {
        addMessage(data.message || 'Login success');
        return refreshDatasetList();
      } else {
        console.log('Failed to log in', data, res);
        if (data && data.error) {
          throw new Error(data.message || 'Unknown error from server');
        }
        throw new Error('Failed to log in');
      }
    })
    .catch(error => {
      addError(error.message);
    });
};

const requestDataset = () => {
  store.updateState({
    loading: true,
    data: null,
    dataset: store.state.dataset,
  });
  api(store.state.dataset)
    .then(({ res, data }) => {
      if (res.status === 200 && !data.error) {
        const invoiceTotal = data.dataset.invoices.reduce(
          (sum, invoice) => sum + invoice.amount,
          0
        );
        const paymentTotal = data.dataset.payments.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );
        data.dataset.summary = {
          invoiceTotal,
          paymentTotal,
          balance: invoiceTotal - paymentTotal,
        };
        store.updateState({
          data: data.dataset,
          loading: false,
        });
      } else {
        console.log('Failed to retrieve dataset', data, res);
        if (data && data.error) {
          throw new Error(data.message || 'Unknown error from server');
        }
        throw new Error('Failed to retrieve dataset');
      }
    })
    .catch(error => {
      addError(error.message);
      store.updateState({
        data: null,
        loading: false,
      });
    });
};

const addInvoice = invoice => {
  store.updateState({ loading: true });
  api(`${store.state.dataset}/add-invoice`, { invoice })
    .then(({ res, data }) => {
      if (res.status === 200 && !data.error) {
        addMessage(data.message);
        return requestDataset();
      }
    })
    .catch(error => {
      addError(error.message);
      return requestDataset();
    });
};

const addPayment = payment => {
  store.updateState({ loading: true });
  api(`${store.state.dataset}/add-payment`, { payment })
    .then(({ res, data }) => {
      if (res.status === 200 && !data.error) {
        addMessage(data.message);
        return requestDataset();
      }
    })
    .catch(error => {
      addError(error.message);
      return requestDataset();
    });
};

const actions = {
  updateDataset(dataset) {
    store.updateState({
      dataset,
      data: null,
    });
  },
  requestDataset,
  addInvoice: () => {
    addInvoice({
      number: +store.state.invNum,
      date: store.state.invDate
        ? moment(store.state.invDate, 'YYYY-MM-DD').format('X')
        : moment().format('X'),
      amount: +store.state.invAmount * 100,
    });
  },
  addPayment: () => {
    addPayment({
      comment: +store.state.payComment,
      date: store.state.payDate
        ? moment(store.state.payDate, 'YYYY-MM-DD').format('X')
        : moment().format('X'),
      amount: +store.state.payAmount * 100,
    });
  },
  updateUsername,
  updatePassword,
  updateField,
  login,
};

const appRoot = document.getElementById('app-root');

const render = () => {
  console.log('<Invoicing {...store.state} {...messagesStore.state} actions={actions} />', <Invoicing {...store.state} {...messagesStore.state} actions={actions} />);
  infernoRender(
    <Invoicing {...store.state} {...messagesStore.state} actions={actions} />,
    appRoot
  );
};

store.subscribe(render);
messagesStore.subscribe(render);

try {
  render();
} catch (e) {
  console.log('render error', e);
}

refreshDatasetList().catch(e => {
  console.log('Probably not logged in.', e);
});
