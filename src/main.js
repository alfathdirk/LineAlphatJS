import { LineAPI } from './api';
import { Message, OpType } from '../curve-thrift/line_types';

let exec = require('child_process').exec;
const myBot = 'u236b88bf1eac2b90e848a6198152e647';

let optime = [];
class LINE extends LineAPI {
    constructor() {
        super();
        this.receiverID = '';
    }

    getOprationType(operations) {
        for (let key in OpType) {
            if(operations.type == OpType[key]) {
                if(key !== 'NOTIFIED_UPDATE_PROFILE') {
                    console.log(`[*] ${key} `);
                    console.log(`[ ${JSON.stringify(operations)} ]`);
                }
            }
        }
    }

    poll(operation) {
        if(operation.type == 25 || operation.type == 26) {
            const txt = (operation.message.text !== '' && operation.message.text != null ) ? operation.message.text.toLowerCase() : '' ;
            let message = new Message();
            this.receiverID = message.to = operation.message.to;
            Object.assign(message,{ ct: operation.createdTime.toString() });
            this.textMessage(txt,message)
        }
        this.getOprationType(operation);
    }

    async textMessage(txt, seq) {

        if(txt == 'halo' || txt == 'sya') {
            this._sendMessage(seq, 'halo disini tasya :)');
        }

        if(txt == 'speed') {
            optime.push(seq.ct);
            this._sendMessage(seq,'processing....');
        }

        if(txt === 'processing....') {
            optime.push(seq.ct);
            const rtime = (parseInt(optime[1]) - parseInt(optime[0])) / 1000;
            this._sendMessage(seq, `Read time ${rtime} second`);
            optime = [];
        }

        if(txt === 'kernel') {
            exec('uname -a;ptime;id;whoami',(err, sto) => {
                this._sendMessage(seq, sto);
            })
        }

        if(txt === 'kickall') {
            let thisgroup = await this._getGroups([seq.to]);
            let totalMember = thisgroup[0].members;
            for (var i = 0; i < totalMember.length; i++) {
                if(totalMember[i].mid != myBot ){
                    this._kickMember(seq.to,[totalMember[i].mid])
                }
            }
        }
    }
}

module.exports = new LINE();