import { LineAPI } from './api';

export class LineClient extends LineAPI {

  constructor(options = {
    id: null, password: null,
    authToken: null, certificate: null
  }) {
    super();
    // if (!(options.authToken || options.id && options.password)) {
    //   throw new Error('id and password or authToken is needed');
    // }

    this.id = options.id;
    this.password = options.password;
    this.certificate = options.certificate;

    this.config.Headers['X-Line-Application'] =
      'IOSIPAD 6.0.0 iPhone OS 9.0.2';
    if (options.authToken) {
      this.authToken = options.authToken;
      this.config.Headers['X-Line-Access'] = options.authToken;
    } else {
      this._setProvider(options.id);
    }

    this.contacts = [];
    this.rooms = [];
    this.groups = [];
  }
  
  getQrFirst() {
    return new Promise((resolve,reject) => {
      this._qrCodeLogin().then(async (res) => {
        this.authToken = res.authToken;
        this.certificate = res.certificate;
        console.log(`
          Your Token: is ${this.authToken}
        `)
        resolve({ authToken: this.authToken, certificate: this.certificate })
      });
    });
  }

  async startx ({ authToken, certificate }) {
    await this._tokenLogin(authToken, certificate);
    return this.longpoll();
  }

  
  
  fetchOps(rev) {
    return this._fetchOps(rev, 5);
  }

  longpoll() {
    return new Promise((resolve, reject) => {
      this._fetchOperations(this.revision, 50).then((operations) => {
        if (!operations) {
          console.log('No operations');
          reject('No operations');
          return;
        }
        return operations.map((operation) => {
              if(operation.revision.toString() != -1) {
                let revisionNum = operation.revision.toString();
                resolve({ revisionNum, operation });
              }
        });
      });
    });
  }

}
