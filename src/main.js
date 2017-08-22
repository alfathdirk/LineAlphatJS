import { LineAPI } from './api';
import { Message } from '../curve-thrift/line_types';

const botID = 'u236b88bf1eac2b90e848a6198152e647';

class LINE extends LineAPI {
    constructor() {
        super();
        this.receiverID = '';
    }

    poll(operation) {
        if(operation.type == 25 || operation.type == 26) {
            const txt = (operation.message.text !== '' && operation.message.text != null ) ? operation.message.text.toLowerCase() : '' ;
            let message = new Message();
            this.receiverID = message.to = operation.message.to;
            message.from_ = botID;
            this.textMessage(txt,message)
        } else {
            console.log(operation)
        }
    }

    textMessage(txt, seq) {
        if(txt == 'halo') {
            seq.to = this.receiverID;
            this._sendMessage(seq, 'halo juga ea');
        }
    }
}

module.exports = new LINE();