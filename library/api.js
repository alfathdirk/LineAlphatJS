'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LineAPI = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _thriftHttp = require('thrift-http');

var _thriftHttp2 = _interopRequireDefault(_thriftHttp);

var _unirest = require('unirest');

var _unirest2 = _interopRequireDefault(_unirest);

var _qrcodeTerminal = require('qrcode-terminal');

var _qrcodeTerminal2 = _interopRequireDefault(_qrcodeTerminal);

var _bluebird = require('bluebird');

var _TalkService = require('../curve-thrift/TalkService');

var _TalkService2 = _interopRequireDefault(_TalkService);

var _line_types = require('../curve-thrift/line_types');

var _pinVerifier = require('./pinVerifier');

var _config = require('./config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LineAPI = exports.LineAPI = function () {
  function LineAPI() {
    _classCallCheck(this, LineAPI);

    this.config = _config.config;
    this.setTHttpClient();
  }

  _createClass(LineAPI, [{
    key: 'setTHttpClient',
    value: function setTHttpClient() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
        protocol: _thriftHttp2.default.TCompactProtocol,
        transport: _thriftHttp2.default.TBufferedTransport,
        headers: this.config.Headers,
        path: this.config.LINE_HTTP_URL
      };

      this.options = options;
      this.connection = _thriftHttp2.default.createHttpConnection(this.config.LINE_DOMAIN, 443, this.options);
      this.connection.on('error', function (err) {
        console.log('err', err);
        return err;
      });
      this._client = _thriftHttp2.default.createHttpClient(_TalkService2.default, this.connection);
    }
  }, {
    key: '_tokenLogin',
    value: function _tokenLogin(authToken, certificate) {
      this.config.Headers['X-Line-Access'] = authToken;
      this.setTHttpClient();
      return _bluebird.Promise.resolve({ authToken: authToken, certificate: certificate });
    }
  }, {
    key: '_qrCodeLogin',
    value: function _qrCodeLogin() {
      var _this = this;

      this.setTHttpClient();
      return new Promise(function (resolve, reject) {
        _this._client.getAuthQrcode(true, 'Alfathdirk-PC', function (err, result) {
          var qrcodeUrl = 'line://au/q/' + result.verifier;
          _qrcodeTerminal2.default.generate(qrcodeUrl);
          Object.assign(_this.config.Headers, { 'X-Line-Access': result.verifier });
          _unirest2.default.get('http://gd2.line.naver.jp/Q').headers(_this.config.Headers).timeout(120000).end(async function (res) {
            var verifiedQr = res.body.result.verifier;

            var _ref = await _this._client.loginWithVerifierForCerificate(verifiedQr),
                authToken = _ref.authToken,
                certificate = _ref.certificate;

            _this.options.headers['X-Line-Access'] = authToken;
            _this.options.path = _this.config.LINE_COMMAND_PATH;
            _this.setTHttpClient(_this.options);
            resolve({ authToken: authToken, certificate: certificate });
          });
        });
      });
    }
  }, {
    key: '_login',
    value: function _login(id, password) {
      var _this2 = this;

      var pinVerifier = new _pinVerifier.PinVerifier(id, password);
      return new _bluebird.Promise(function (resolve, reject) {
        return _this2._setProvider(id).then(function () {
          _this2.setTHttpClient();
          _this2._client.getRSAKeyInfo(_this2.provider, function (key, credentials) {
            var rsaCrypto = pinVerifier.getRSACrypto(credentials);
            try {
              _this2._client.loginWithIdentityCredentialForCertificate(_this2.provider, rsaCrypto.keyname, rsaCrypto.credentials, true, _this2.config.ip, 'purple-line', '', function (err, result) {
                if (err) {
                  console.log('LoginFailed');
                  console.error(err);
                  return reject(err);
                }
                console.log(result);
                _this2._client.pinCode = result.pinCode;
                _this2.alertOrConsoleLog('Enter Pincode ' + result.pinCode + '\n                  to your mobile phone in 2 minutes');
                _this2._checkLoginResultType(result.type, result);
                _this2._loginWithVerifier(result).then(function (verifierResult) {
                  _this2._checkLoginResultType(verifierResult.type, verifierResult);
                  resolve(verifierResult);
                });
              });
            } catch (error) {
              console.log('error');
              console.log(error);
            }
          });
        });
      });
    }
  }, {
    key: '_loginWithVerifier',
    value: function _loginWithVerifier() {
      var _this3 = this;

      return this.getJson(this.config.LINE_CERTIFICATE_URL).then(function (json) {
        return _this3._client.loginWithVerifierForCertificate(json.result.verifier);
      }, function (err) {
        return console.log('LoginWithVerifierForCertificate Error: ' + err);
      });
    }
  }, {
    key: '_setProvider',
    value: function _setProvider(id) {
      this.provider = this.config.EMAIL_REGEX.test(id) ? _line_types.IdentityProvider.LINE : _line_types.IdentityProvider.NAVER_KR;

      return this.provider === _line_types.IdentityProvider.LINE ? this.getJson(this.config.LINE_SESSION_LINE_URL) : this.getJson(this.config.LINE_SESSION_NAVER_URL);
    }
  }, {
    key: '_checkLoginResultType',
    value: function _checkLoginResultType(type, result) {
      this.config.Headers['X-Line-Access'] = result.authToken || result.verifier;
      if (result.type === _line_types.LoginResultType.SUCCESS) {
        this.certificate = result.certificate;
        this.authToken = result.authToken;
      } else if (result.type === _line_types.LoginResultType.REQUIRE_QRCODE) {
        console.log('require QR code');
      } else if (result.type === _line_types.LoginResultType.REQUIRE_DEVICE_CONFIRM) {
        console.log('require device confirm');
      } else {
        throw new Error('unkown type');
      }
      return result;
    }
  }, {
    key: '_sendMessage',
    value: function _sendMessage(message, txt) {
      var seq = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

      message.text = txt;
      return this._client.sendMessage(0, message);
    }
  }, {
    key: '_fetchOperations',
    value: function _fetchOperations(revision) {
      var count = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 50;

      return this._client.fetchOperations(revision, count);
    }
  }, {
    key: '_fetchOps',
    value: function _fetchOps(revision) {
      var count = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 50;

      return this._client.fetchOps(revision, count);
    }
  }, {
    key: 'getJson',
    value: function getJson(path) {
      var _this4 = this;

      return new _bluebird.Promise(function (resolve, reject) {
        return _unirest2.default.get('https://' + _this4.config.LINE_DOMAIN + path).headers(_this4.config.Headers).timeout(120000).end(function (res) {
          return res.error ? reject(res.error) : resolve(res.body);
        });
      });
    }
  }]);

  return LineAPI;
}();