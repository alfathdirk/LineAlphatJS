'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _api = require('./api');

var _line_types = require('../curve-thrift/line_types');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var botID = 'u236b88bf1eac2b90e848a6198152e647';

var LINE = function (_LineAPI) {
    _inherits(LINE, _LineAPI);

    function LINE() {
        _classCallCheck(this, LINE);

        var _this = _possibleConstructorReturn(this, (LINE.__proto__ || Object.getPrototypeOf(LINE)).call(this));

        _this.receiverID = '';
        return _this;
    }

    _createClass(LINE, [{
        key: 'poll',
        value: function poll(operation) {
            if (operation.type == 25 || operation.type == 26) {
                var txt = operation.message.text !== '' && operation.message.text != null ? operation.message.text.toLowerCase() : '';
                var message = new _line_types.Message();
                this.receiverID = message.to = operation.message.to;
                message.from_ = botID;
                this.textMessage(txt, message);
            } else {
                console.log(operation);
            }
        }
    }, {
        key: 'textMessage',
        value: function textMessage(txt, seq) {
            if (txt == 'halo') {
                seq.to = this.receiverID;
                this._sendMessage(seq, 'halo juga ea');
            }
        }
    }]);

    return LINE;
}(_api.LineAPI);

module.exports = new LINE();