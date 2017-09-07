const thrift = require('thrift-http');
const unirest = require('unirest');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const TalkService = require('../curve-thrift/TalkService');
const {
  LoginResultType,
  IdentityProvider,
  ContentType,
  Message
} = require('../curve-thrift/line_types');


const PinVerifier = require('./pinVerifier');
const config = require('./config');

class LineAPI {
  constructor() {
    this.config = config;
    this.setTHttpClient();
  }

  setTHttpClient(options = {
    protocol: thrift.TCompactProtocol,
    transport: thrift.TBufferedTransport,
    headers: this.config.Headers,
    path: this.config.LINE_HTTP_URL,
    https: true
  }) {
    options.headers['X-Line-Application'] = 'DESKTOPMAC 10.10.2-YOSEMITE-x64 MAC 4.5.0';
    this.options = options;
    this.connection =
      thrift.createHttpConnection(this.config.LINE_DOMAIN, 443, this.options);
    this.connection.on('error', (err) => {
      console.log('err',err);
      return err;
    });
    this._client = thrift.createHttpClient(TalkService, this.connection);
    
  }

  _tokenLogin(authToken, certificate) {
    this.config.Headers['X-Line-Access'] = authToken;
    this.setTHttpClient();
    return Promise.resolve({ authToken, certificate });
  }

  _qrCodeLogin() {
    this.setTHttpClient();
    return new Promise((resolve, reject) => {
    this._client.getAuthQrcode(true, 'Alfathdirk-PC',(err, result) => {
      // console.log('here')
      const qrcodeUrl = `line://au/q/${result.verifier}`;
      qrcode.generate(qrcodeUrl,{small: true});
      console.info(`\n\nlink qr code is: ${qrcodeUrl}`)
      Object.assign(this.config.Headers,{ 'X-Line-Access': result.verifier });
        unirest.get('https://gd2.line.naver.jp/Q')
          .headers(this.config.Headers)
          .timeout(120000)
          .end(async (res) => {
            const verifiedQr = res.body.result.verifier;
            const { authToken, certificate } =
              await this._client.loginWithVerifierForCerificate(verifiedQr);
            this.options.headers['X-Line-Access'] = authToken;
            this.options.path = this.config.LINE_COMMAND_PATH;
            this.setTHttpClient(this.options);
            resolve({ authToken, certificate });
          });
      });
    });
  }

  _login(id, password) {
    const pinVerifier = new PinVerifier(id, password);
    return new Promise((resolve, reject) => (
      this._setProvider(id)
      .then(() => {
        this.setTHttpClient();
        this._client.getRSAKeyInfo(this.provider, (key, credentials) => {
          const rsaCrypto = pinVerifier.getRSACrypto(credentials);
          try {
            this._client.loginWithIdentityCredentialForCertificate(
              this.provider, rsaCrypto.keyname, rsaCrypto.credentials,
              true, this.config.ip, 'purple-line', '',
              (err, result) => {
                if (err) {
                  console.log('LoginFailed');
                  console.error(err);
                  return reject(err);
                }
                this._client.pinCode = result.pinCode;
                this.alertOrConsoleLog(
                  `Enter Pincode ${result.pinCode}
                  to your mobile phone in 2 minutes`
                );
                this._checkLoginResultType(result.type, result);
                this._loginWithVerifier(result)
                .then((verifierResult) => {
                  this._checkLoginResultType(verifierResult.type, verifierResult);
                  resolve(verifierResult);
                });
              });
          } catch(error) {
            console.log('error');
            console.log(error);
          }
        });
      })
    ));
  }

  _loginWithVerifier() {
    return this.getJson(this.config.LINE_CERTIFICATE_URL)
    .then(
      (json) =>
        this._client.loginWithVerifierForCertificate(json.result.verifier)
      , (err) => console.log(`LoginWithVerifierForCertificate Error: ${err}`)
    );
  }

  _setProvider(id) {
    this.provider = this.config.EMAIL_REGEX.test(id) ?
      IdentityProvider.LINE :
      IdentityProvider.NAVER_KR;

    return this.provider === IdentityProvider.LINE ?
      this.getJson(this.config.LINE_SESSION_LINE_URL) :
      this.getJson(this.config.LINE_SESSION_NAVER_URL);
  }

  _checkLoginResultType(type, result) {
    this.config.Headers['X-Line-Access'] = result.authToken || result.verifier;
    if (result.type === LoginResultType.SUCCESS) {
      this.certificate = result.certificate;
      this.authToken = result.authToken;
    } else if (result.type === LoginResultType.REQUIRE_QRCODE) {
      console.log('require QR code');
    } else if (result.type === LoginResultType.REQUIRE_DEVICE_CONFIRM) {
      console.log('require device confirm');
    } else {
      throw new Error('unkown type');
    }
    return result;
  }

  _sendMessage(message, txt ,seq = 0) {
    message.text = txt;
    return this._client.sendMessage(0, message);
  }

  _kickMember(group,memid) {
    return this._client.kickoutFromGroup(0,group,memid);
  }

  _cancel(groupid,member) {
    return this._client.cancelGroupInvitation(0,groupid,member);
  }

  async _getGroupsJoined() {
    return await this._client.getGroupIdsJoined()
  }

  async _myProfile() {
    return await this._client.getProfile();
  }
  async _getGroupsInvited() {
    return await this._client.getGroupIdsInvited()
  }

  async _acceptGroupInvitation(groupid) {
    this._client.acceptGroupInvitation(0,groupid);
    await this._getGroupsInvited();
    await this._getGroupsJoined();
    return;
  }

  _invite(group,member) {
    return this._client.inviteIntoGroup(0, group, member)
  }

  async _updateGroup(group) {
    return await this._client.updateGroup(0, group)
  }

  _getContacts(mid) {
    return this._client.getContacts(mid)
  }

  async _getGroups(groupId) {
      return await this._client.getGroups(groupId);
  }

  async _getGroup(groupId) {
    return await this._client.getGroup(groupId);
  }

  async _reissueGroupTicket(groupId) {
    return await this._client.reissueGroupTicket(groupId);
  }

  async _findGroupByTicket(ticketID){
    return await this._client.findGroupByTicket(ticketID);
  }
  
  async _acceptGroupInvitationByTicket(gid,ticketID){
    return await this._client.acceptGroupInvitationByTicket(0,gid,ticketID);
  }

  async _sendImage(message,filepaths, filename = 'media') {
    let M = new Message();
    M.to = message.to;
    M.contentType= 1;
    M.contentPreview= null;
    M.contentMetadata= null;

    const filepath = path.resolve(__dirname,filepaths)
    fs.readFile(filepath,async (err, bufs) => {
      let imgID = await this._client.sendMessage(0,M).id ;
      console.log(imgID);
        const data = {
          params: JSON.stringify({
            name: filename,
            oid: imgID,
            size: bufs.length,
            type: 'image',
            ver: '1.0'
          })
        };
        return this
          .postContent(config.LINE_POST_CONTENT_URL, data, filepath)
          .then((res) => (res.error ? console.log('err',res.error) : console.log('sxxxx',res)));
    });
  }

  postContent(url, data = null, filepath = null) {
    console.log('head',this.config.Headers);
    return new Promise((resolve, reject) => (
      unirest.post(url)
        .headers({
          ...this.config.Headers,
          'Content-Type': 'multipart/form-data'
        })
        .timeout(120000)
        .field(data)
        .attach('files', filepath)
        .end((res) => {
          console.log(res.error);
          res.error ? reject(res.error) : resolve(res)
        })
    ));
  }
  
  _fetchOperations(revision, count = 5) {
    // this.options.path = this.config.LINE_POLL_URL
    return this._client.fetchOperations(revision, count);
  }

  _fetchOps(revision, count = 5) {
    return this._client.fetchOps(revision, count);
  }

  getJson(path) {
    return new Promise((resolve, reject) => (
      unirest.get(`https://${this.config.LINE_DOMAIN}${path}`)
        .headers(this.config.Headers)
        .timeout(120000)
        .end((res) => (
          res.error ? reject(res.error) : resolve(res.body)
        ))
    ));
  }
}

module.exports = LineAPI;