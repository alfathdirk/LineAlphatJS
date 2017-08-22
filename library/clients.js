'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LineClient = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _api = require('./api');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LineClient = exports.LineClient = function (_LineAPI) {
  _inherits(LineClient, _LineAPI);

  function LineClient() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      id: null, password: null,
      authToken: null, certificate: null
    };

    _classCallCheck(this, LineClient);

    // if (!(options.authToken || options.id && options.password)) {
    //   throw new Error('id and password or authToken is needed');
    // }

    var _this = _possibleConstructorReturn(this, (LineClient.__proto__ || Object.getPrototypeOf(LineClient)).call(this));

    _this.id = options.id;
    _this.password = options.password;
    _this.certificate = options.certificate;

    _this.config.Headers['X-Line-Application'] = 'IOSIPAD 6.0.0 iPhone OS 9.0.2';
    if (options.authToken) {
      _this.authToken = options.authToken;
      _this.config.Headers['X-Line-Access'] = options.authToken;
    } else {
      _this._setProvider(options.id);
    }

    _this.contacts = [];
    _this.rooms = [];
    _this.groups = [];
    return _this;
  }

  _createClass(LineClient, [{
    key: 'getQrFirst',
    value: function getQrFirst() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2._qrCodeLogin().then(async function (res) {
          _this2.authToken = res.authToken;
          _this2.certificate = res.certificate;
          resolve({ authToken: _this2.authToken, certificate: _this2.certificate });
        });
      });
    }
  }, {
    key: 'startx',
    value: async function startx(_ref) {
      var authToken = _ref.authToken,
          certificate = _ref.certificate;

      await this._tokenLogin(authToken, certificate);
      return this.longpoll();
    }
  }, {
    key: 'up',
    value: async function up() {
      await this._tokenLogin(this.authToken, this.certificate);
      return this.longpoll();
    }
  }, {
    key: 'fetchOps',
    value: function fetchOps(rev) {
      return this._fetchOps(rev, 5);
    }
  }, {
    key: 'longpoll',
    value: function longpoll() {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _this3._fetchOperations(_this3.revision, 50).then(function (operations) {
          if (!operations) {
            console.log('No operations');
            reject('No operations');
            return;
          }
          return operations.map(function (operation) {
            if (operation.revision.toString() != -1) {
              var revisionNum = operation.revision.toString();
              resolve({ revisionNum: revisionNum, operation: operation });
            }
          });
        });
      });
    }
  }]);

  return LineClient;
}(_api.LineAPI);