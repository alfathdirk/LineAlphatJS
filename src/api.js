const thrift = require('thrift-http');
const unirest = require('unirest');
const qrcode = require('qrcode-terminal');
const util = require("util");
const mime = require("mime");
const fs = require('fs');
const path = require('path');
const rp = require('request-promise');
const request = require('request');
const Lyrics = require('../helpers/lirik');
const Ig = require('../helpers/instagram');

const LineService = require('../curve-thrift/LineService');
const {
  LoginResultType,
  IdentityProvider,
  ContentType,
  Message,
  LoginRequest
} = require('../curve-thrift/line_types');

const PinVerifier = require('./pinVerifier');
var config = require('./config');
var moment = require('moment');
var reqx = new LoginRequest();
var reqxy = new LoginRequest();

class LineAPI {
  constructor() {
    this.config = config;
    this.setTHttpClient();
    this.axz = false;
    this.axy = false;
    this.gdLine = "http://gd2.line.naver.jp";
    this.gdLine2 = "http://gf.line.naver.jp";
  }

  setTHttpClient(options = {
    protocol: thrift.TCompactProtocol,
    transport: thrift.TBufferedTransport,
    headers: this.config.Headers,
    path: this.config.LINE_HTTP_URL,
    https: true
  }) {
    //options.headers['X-Line-Application'] = 'CHROMEOS\t2.1.0\tChrome_OS\t1';
    options.headers['X-Line-Application'] = 'IOSIPAD 7.14.0 iPhone OS 10.12.0';
    //options.headers['X-Line-Application'] = 'DESKTOPMAC\t5.3.3-YOSEMITE-x64\tMAC\t10.12.0';
    this.options = options;
    this.connection =
      thrift.createHttpConnection(this.config.LINE_DOMAIN_3RD, 443, this.options);
    this.connection.on('error', (err) => {
      console.log('err',err);
      return err;
    });
    if(this.axz === true){
      this._channel = thrift.createHttpClient(require('../curve-thrift/ChannelService.js'), this.connection);this.axz = false;
    } else if(this.axy === true){
      this._authService = thrift.createHttpClient(require('../curve-thrift/AuthService.js'), this.connection);this.axy = false;
    } else {
        this._client = thrift.createHttpClient(LineService, this.connection);
    }
  }

  async _chanConn(){
    this.options.headers['X-Line-Access'] = this.config.tokenn;
    this.options.path = this.config.LINE_CHANNEL_PATH;
    this.axz = true;
    this.setTHttpClient(this.options);
    return Promise.resolve();
  }
  
  async _authConn(){
    this.axy = true;
    this.options.path = this.config.LINE_RS;
      this.setTHttpClient(this.options);
    return Promise.resolve();
  }

  async _tokenLogin(authToken, certificate) {
  this.options.path = this.config.LINE_COMMAND_PATH;
    this.config.Headers['X-Line-Access'] = authToken;config.tokenn = authToken;
    this.setTHttpClient(this.options);
    return Promise.resolve({ authToken, certificate });
  }

  _qrCodeLogin() {
    this.setTHttpClient();
    return new Promise((resolve, reject) => {
    this._client.getAuthQrcode(true, 'Alfathdirk-PC',(err, result) => {
      const qrcodeUrl = `line://au/q/${result.verifier}`;
      qrcode.generate(qrcodeUrl,{small: true});
      console.info(`\n\nlink qr code is: ${qrcodeUrl}`)
      Object.assign(this.config.Headers,{ 'X-Line-Access': result.verifier });
        unirest.get('https://gd2.line.naver.jp/Q')
          .headers(this.config.Headers)
          .timeout(120000)
          .end(async (res) => {
            const verifiedQr = res.body.result.verifier;
      this._authConn();
      reqx.type = 1;
      reqx.verifier = verifiedQr;
      this._authService.loginZ(reqx,(err,success) => {
        config.tokenn = success.authToken;
        config.certificate = success.certificate;
        const authToken = config.tokenn;
          const certificate = config.certificate;
                this.options.headers['X-Line-Access'] = config.tokenn;
                this.options.path = this.config.LINE_COMMAND_PATH;
                this.setTHttpClient(this.options);
          this.options.headers['User-Agent'] = 'Line/7.18.1';
          this.axz = true;
          this.setTHttpClient(this.options);
          this.axz = false;
                resolve({ authToken, certificate, verifiedQr });
      })
          });
      });
    });
  }


  _xlogin(id,password){
    const pinVerifier = new PinVerifier(id, password);
      return new Promise((resolve, reject) => (
       this._setProvider(id).then(() => {
       this.setTHttpClient();
       this._getRSAKeyInfo(this.provider, (key, credentials) => {
         this.options.path = this.config.LINE_RS;
                 this.setTHttpClient(this.options);
         const rsaCrypto = pinVerifier.getRSACrypto(credentials);
         reqx.type = 0;
         reqx.identityProvider = this.provider;
         reqx.identifier = rsaCrypto.keyname;
         reqx.password = rsaCrypto.credentials;
         reqx.keepLoggedIn = true;
         reqx.accessLocation = this.config.ip;
         reqx.systemName = 'LineAlphatFork';
         reqx.e2eeVersion = 0;
         try{
           this._client.loginZ(reqx,
           (err,success) => {
             if (err) {
                             console.log('\n\n');
                             console.error("=> "+err.reason);
                             process.exit();
                         }
             this.options.path = this.config.LINE_COMMAND_PATH;
                         this.setTHttpClient(this.options);
             this._authConn();
             this._client.pinCode = success.pinCode;
                     console.info("\n\n=============================\nEnter This Pincode => "+success.pinCode+"\nto your mobile phone in 2 minutes\n=============================");
                     this._checkLoginResultType(success.type, success);
             reqxy.type = 1;
                       this._loginWithVerifier((verifierResult) => {
               this.options.path = this.config.LINE_COMMAND_PATH;
                             this.setTHttpClient(this.options);
               config.tokenn = verifierResult.authToken;
                           this._checkLoginResultType(verifierResult.type, verifierResult);
                           resolve(verifierResult);
                       });
           });
         }catch(error) {
                     console.log('error');
                     console.log(error);
                 }
       })
     })
    ));
  }

  async _loginWithVerifier(callback) {
    let retx = await this.getJson(this.config.LINE_CERTIFICATE_URL)
    reqxy.verifier = retx.result.verifier;
    this._authService.loginZ(reqxy,(err,success) => {
      callback(success);
    })
  }

  _setProvider(id) {
    this.provider = this.config.EMAIL_REGEX.test(id) ?
      IdentityProvider.LINE :
      IdentityProvider.NAVER_KR;

    return this.provider === IdentityProvider.LINE ?
      this.getJson(this.config.LINE_SESSION_LINE_URL) :
      this.getJson(this.config.LINE_SESSION_NAVER_URL);
  }

  async _getRSAKeyInfo(provider, callback){
    let result = await this._client.getRSAKeyInfo(provider);
    callback(result.keynm, result);
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
