import './invoicing.scss';
import moment from 'moment';

const Invoicing = props => (
  <div className="invoicing">
    <form
      onSubmit={e => {
        e.preventDefault();
        props.actions.login();
      }}
    >
      <div>
        <label>
          Username{' '}
          <input
            type="text"
            value={props.username}
            onChange={e => props.actions.updateUsername(e.target.value)}
          />
        </label>
        <label>
          Password{' '}
          <input
            type="text"
            value={props.password}
            onChange={e => props.actions.updatePassword(e.target.value)}
          />
        </label>
        <button type="submit">Login</button>
      </div>
    </form>
    <h1>Invoicing</h1>
    <form
      onSubmit={e => {
        e.preventDefault();
        props.actions.requestDataset();
      }}
    >
      <label>
        Dataset{' '}
        <input
          type="text"
          value={props.dataset}
          onChange={e => props.actions.updateDataset(e.target.value)}
        />
      </label>
      <button type="submit">Load</button>
    </form>
    <div>
      <label>
        Or Select From{' '}
        <select
          onChange={e => {
            if (e.target.value) {
              props.actions.updateDataset(e.target.value);
              props.actions.requestDataset();
            }
          }}
        >
          <option value="" />
          {props.datasetList.map(filename => (
            <option value={filename}>{filename}</option>
          ))}
        </select>
      </label>
    </div>
    {props.loading ? (
      <div className="loading-block">...loading...</div>
    ) : props.data ? (
      <div className="data-container">
        <h1>{props.dataset}</h1>
        <div className="summary">
          <div>
            <span>Invoice Total:</span>
            <span>${props.data.summary.invoiceTotal / 100}</span>
          </div>
          <div>
            <span>Payment Total:</span>
            <span>${props.data.summary.paymentTotal / 100}</span>
          </div>
          <div>
            <span>Balance:</span>
            <span>${props.data.summary.balance / 100}</span>
          </div>
        </div>
        <div className="data-columns">
          <div className="invoice-data">
            <h2>Invoices</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                props.actions.addInvoice();
              }}
            >
              <div>
                <label>
                  <span>Invoice Number</span>
                  <input
                    type="text"
                    value={props.invNum}
                    onChange={e =>
                      props.actions.updateField('invNum', e.target.value)}
                  />
                </label>
              </div>
              <div>
                <label>
                  <span>Date (YYYY-MM-DD)</span>
                  <input
                    type="text"
                    value={props.invDate}
                    onChange={e =>
                      props.actions.updateField('invDate', e.target.value)}
                  />
                </label>
                <div className="helper-text">
                  Leave blank to use today's date
                </div>
              </div>
              <div>
                <label>
                  <span>Amount</span>
                  <input
                    type="text"
                    value={props.invAmount}
                    onChange={e =>
                      props.actions.updateField('invAmount', e.target.value)}
                  />
                </label>
              </div>
              <button type="submit">Add Invoice</button>
            </form>
            <div>
              <ul>
                {props.data.invoices.map(inv => (
                  <li className="invoice">
                    <span>{inv.number}</span>
                    <span>
                      {moment.unix(inv.date).format('dddd, MMMM Do YYYY')}
                    </span>
                    <span>${inv.amount / 100}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="payment-data">
            <h2>Payments</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                props.actions.addPayment();
              }}
            >
              <div>
                <label>
                  <span>Payment Comment</span>
                  <input
                    type="text"
                    value={props.payComment}
                    onChange={e =>
                      props.actions.updateField('payComment', e.target.value)}
                  />
                </label>
              </div>
              <div>
                <label>
                  <span>Date (YYYY-MM-DD)</span>
                  <input
                    type="text"
                    value={props.payDate}
                    onChange={e =>
                      props.actions.updateField('payDate', e.target.value)}
                  />
                </label>
                <div className="helper-text">
                  Leave blank to use today's date
                </div>
              </div>
              <div>
                <label>
                  <span>Amount</span>
                  <input
                    type="text"
                    value={props.payAmount}
                    onChange={e =>
                      props.actions.updateField('payAmount', e.target.value)}
                  />
                </label>
              </div>
              <button type="submit">Add Payment</button>
            </form>
            <div>
              <ul>
                {props.data.payments.map(payment => (
                  <li className="payment">
                    <span>{payment.comment}</span>
                    <span>
                      {moment.unix(payment.date).format('dddd, MMMM Do YYYY')}
                    </span>
                    <span>${payment.amount / 100}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="data-container">Enter a dataset and hit load</div>
    )}
    <div className="messages">
      <ul>
        {props.messages.map(({ message, type }) => (
          <li className={type}>{message}</li>
        ))}
      </ul>
    </div>
  </div>
);
export default Invoicing;
