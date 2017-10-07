const thrift = require('thrift-http');
const unirest = require('unirest');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const Lyrics = require('../helpers/lirik');
const Ig = require('../helpers/instagram');

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
    // options.headers['X-Line-Application'] = 'DESKTOPMAC 10.10.2-YOSEMITE-x64 MAC 4.5.1';
    options.headers['X-Line-Application'] = 'CHROMEOS\x091.4.13\x09Chrome_OS\x091';
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
        unirest.get(`https://${this.config.LINE_DOMAIN}/Q`)
          .headers(this.config.Headers)
          .timeout(120000)
          .end(async (res) => {
            const verifiedQr = res.body.result.verifier;
            const { authToken, certificate } =
              await this._client.loginWithVerifierForCerificate(verifiedQr);
            this.options.headers['X-Line-Access'] = authToken;
            // this.options.path = this.config.LINE_COMMAND_PATH;
            this.setTHttpClient();
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

  async _sendMessage(message, txt ,seq = 0) {
    message.text = txt;
    return await this._client.sendMessage(0, message);
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

  async _getGroupsInvited() {
    return await this._client.getGroupIdsInvited();
  }

  async _myProfile() {
    return await this._client.getProfile();
  }

  _inviteIntoGroup(group,memid) {
    return this._client.inviteIntoGroup(0,group,memid);
  }

  async _findGroupByName(name) {
    let group = [];
    let groupID = await this._getGroupsJoined();
    let groups = await this._getGroups(groupID);
    for (let key in groups) {
        if(groups[key].name === name){
          group.push(groups[key]);
        }
    }
    return group;

  }

  async _refrehGroup() {
    await this._getGroupsInvited();
    await this._getGroupsJoined();
    return;
  }

  _rejectGroupInvitation(groupIds) {
    return this._client.rejectGroupInvitation(0,groupIds);
  }

  async _createGroup(groupName,members) {
    await this._getAllContactIds();
    return this._client.createGroup(0,groupName,members);
  }

  async _getAllContactIds(){
    return await this._client.getAllContactIds();
  }

  async _createRoom(memberids) {
    return await this._client.createRoom(0,[memberids]);
  }
  
  async _acceptGroupInvitation(groupid) {
    this._client.acceptGroupInvitation(0,groupid);
    await this._refrehGroup();
    return;
  }

  _invite(group,member) {
    return this._client.inviteIntoGroup(0, group, member)
  }

  async _updateGroup(group) {
    return await this._client.updateGroup(0, group)
  }

  async _updateProfile(profile) {
    return await this._client.updateProfile(0, profile)
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

  _leaveGroup(gid) {
    return this._client.leaveGroup(0,gid);
  }
  
  async _reissueGroupTicket(groupId) {
    return await this._client.reissueGroupTicket(groupId);
  }

  async _findGroupByTicket(ticketID){
    return await this._client.findGroupByTicket(ticketID);
  }
  
  async _acceptGroupInvitationByTicket(gid,ticketID){
    this._refrehGroup();
    return await this._client.acceptGroupInvitationByTicket(0,gid,ticketID);
  }

  async _sendFileByUrl(message,uri) {
    let media = 1;
    if (!fs.existsSync(__dirname+'/tmp')){
        await fs.mkdirSync(__dirname+'/tmp');
    }
    let head = await unirest.head(uri,async (res) => {
      let formatFile =  res.headers['content-type'].split('/')[1].toLowerCase();
      let locationFile = __dirname + `/tmp/${Math.floor(Math.random() * 100)}.${formatFile}`;
      await unirest.get(uri).end().pipe(fs.createWriteStream(locationFile));
      return this._sendFile(message,locationFile,media);
    });
  }

  async _sendImageByUrl(message,uri) {
    await this._sendFileByUrl(message,uri);
  }

  async _sendImage(message, filePath) {
    this._sendFile(message,filePath, 1);
  }

  async _download(uri,name,type) {
    let formatType;
    switch (type) {
      case 3:
        formatType = 'm4a';
        break;
      default:
        formatType = 'jpg';
        break;
    }
    let dir = __dirname+'/../download';
    if (!fs.existsSync(dir)){
      await fs.mkdirSync(dir);
    }
    await unirest
    .get(uri)
    .headers({
      ...this.config.Headers
    })
    .end((res) => {
        if(res.error) {
            console.log(res.error);
            return 'err';
        }
    }).pipe(fs.createWriteStream(`${dir}/${name}.${formatType}`));
  }

  async _sendFile(message,filepaths, typeContent = 1) {
    let filename = 'media';
    let typeFile;
    
    switch (typeContent) {
      case 2:
        typeFile = 'video'
        break;
      case 3:
        typeFile = 'audio'
        break;
      default:
        typeFile = 'image'
        break;
    }

    let M = new Message();
    M.to = message.to;
    M.contentType= typeContent;
    M.contentPreview= null;
    M.contentMetadata= null;


    const filepath = path.resolve(__dirname,filepaths)
    console.log('File Locate on',filepath);
    fs.readFile(filepath,async (err, bufs) => {
      let imgID = await this._client.sendMessage(0,M);
        const data = {
          params: JSON.stringify({
            name: filename,
            oid: imgID.id,
            size: bufs.length,
            type: typeFile,
            ver: '1.0'
          })
        };
        return this
          .postContent(config.LINE_POST_CONTENT_URL, data, filepath)
          .then((res) => {
            if(res.err) {
              console.log('err',res.error)
              return;
            } 
            console.log(res.headers);
            if(filepath.search(/download\//g) === -1) {
              fs.unlink(filepath, (err) => {
                if (err) {
                  console.log('err on upload',err);
                  return err
                };
                console.log(`successfully deleted ${filepath}`);
              });
            }
            
          });
    });
  }

  postContent(url, data = null, filepath = null) {
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
          if(res.err) {
            console.error('error on post to server');
            reject(res.error);
            return;
          }
          resolve(res)
        })
    ));
  }
  
  async _fetchOperations(revision, count) {
    // this.options.path = this.config.LINE_POLL_URL
    return await this._client.fetchOperations(revision, count);
  }

  _fetchOps(revision, count = 5) {
    return this._client.fetchOps(revision, count,0,0);
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

  async _searchLyrics(title) {
    let lirik = await Lyrics(title);
    return lirik
  }

  async _searchInstagram(username) {
    let ig = await Ig(username);
    return ig
  }
}

module.exports = LineAPI;
