import { LineAPI } from './api';

export class LineConnect extends LineAPI {

  constructor(options) {
    super();

    this.config.Headers['X-Line-Application'] =
      'IOSIPAD 6.0.0 iPhone OS 9.0.2';
    this.config.Headers['X-Line-Access'] = '';
      
    if (typeof options !== 'undefined') {
      this.authToken = options.authToken;
      this.certificate = options.certificate;
      this.config.Headers['X-Line-Access'] = options.authToken;
    } else {
     
    }
  }
  
  getQrFirst() {
    return new Promise((resolve,reject) => {
      this._qrCodeLogin().then(async (res) => {
        this.authToken = res.authToken;
        this.certificate = res.certificate;
        console.log(`[*] Token: ${this.authToken}`);
        console.log(`[*] Certificate: ${res.certificate}\n`);
        let { mid, displayName } = await this._client.getProfile();
        console.log(`[*] mid: ${mid}\n`);
        console.log(`[*] Name: ${displayName}\n`);
        console.log(`NOTE: Dont forget , put your mid and admin on variable 'myBot' in main.js \n`);
        console.log(`Regrads Alfathdirk and thx for TCR Team \n`);
        console.log(`=======BOT RUNNING======\n`);
        await this._tokenLogin(this.authToken, this.certificate);
        resolve();
      });
    });
  }

  async startx () {
    if (typeof this.authToken != 'undefined'){
      await this._tokenLogin(this.authToken, this.certificate);
      return this.longpoll();
    } else {
      return new Promise((resolve, reject) => {
        this.getQrFirst().then(async (res) => {
          resolve(this.longpoll());
        });
      })
    }
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
