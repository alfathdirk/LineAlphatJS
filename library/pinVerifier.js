'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PinVerifier = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utf = require('utf8');

var _utf2 = _interopRequireDefault(_utf);

var _nodeBignumber = require('node-bignumber');

var _nodeBignumber2 = _interopRequireDefault(_nodeBignumber);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PinVerifier = exports.PinVerifier = function () {
  function PinVerifier(id, password) {
    _classCallCheck(this, PinVerifier);

    this.id = id;
    this.password = password;
  }

  _createClass(PinVerifier, [{
    key: 'getRSACrypto',
    value: function getRSACrypto(json) {
      var rsa = new _nodeBignumber2.default.Key();
      var chr = String.fromCharCode;
      var sessionKey = json.sessionKey;
      var message = _utf2.default.encode(chr(sessionKey.length) + sessionKey + chr(this.id.length) + this.id + chr(this.password.length) + this.password);
      rsa.setPublic(json.nvalue, json.evalue);
      var credentials = rsa.encrypt(message).toString('hex');
      var keyname = json.keynm;
      return { keyname: keyname, credentials: credentials, message: message };
    }
  }]);

  return PinVerifier;
}();