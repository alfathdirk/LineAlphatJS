import { LineAPI } from './api';
import { Message, OperationType } from '../curve-thrift/line_types';

let exec = require('child_process').exec;
const admin = 'u236b88bf1eac2b90e848a6198152e6472';
const myBot = 'uc93c736a8b385208c2aa7aed58de2ceb';

let optime = [];
let kicker = {
    'namagrup123': ['user1','user1'],
}

class LINE extends LineAPI {
    constructor() {
        super();
        this.receiverID = '';
    }

    getOprationType(operations) {
        for (let key in OperationType) {
            if(operations.type == OperationType[key]) {
                if(key !== 'NOTIFIED_UPDATE_PROFILE') {
                    console.log(`[* ${operations.type} ] ${key} `);
                    // console.log(`[ ${JSON.stringify(operations)} ]`);
                }
            }
        }
    }


    poll(operation) {

        if(operation.type == 25 || operation.type == 26) {
            const txt = (operation.message.text !== '' && operation.message.text != null ) ? operation.message.text.toLowerCase() : '' ;
            let message = new Message();
            this.receiverID = message.to = (operation.message.to === myBot) ? operation.message.from : operation.message.to ;
            Object.assign(message,{ ct: operation.createdTime.toString() });
            this.textMessage(txt,message)
        }

        if(operation.type == 13) {
            this.cancelAll(operation.param1);
        }

        if(operation.type == 19) { //ada kick
            // Object.assign(kicker,{ [operation.param1] : operation.param2 });
            this._kickMember(operation.param1,[operation.param2]);
        }

        if(operation.type == 13) { // diinvite
            if(operation.param2 == admin) {
                return this._acceptGroupInvitation(operation.param1);
            } else {
                return this._cancel(operation.param1,[myBot]);
            }
        }
        this.getOprationType(operation);
        console.log(operation);
    }

    async cancelAll(gid) {
        let { listPendingInvite } = await this.searchGroup(gid);
        if(listPendingInvite.length > 0){
            this._cancel(gid,listPendingInvite);
        }
    }

    async searchGroup(gid) {
        let thisgroup = await this._getGroups([gid]);
        let listPendingInvite = thisgroup[0].invitee.map((key) => {
            return key.mid;
        });
        let listMember = thisgroup[0].members.map((key) => {
            return { mid: key.mid, dn: key.displayName };
        });

        return { 
            listMember,
            listPendingInvite
        }
    }

    async textMessage(txt, seq) {

        if(txt == 'cancel') {
            this.cancelAll(seq.to);
        }

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
            this._sendMessage(seq, `${rtime} second`);
            optime = [];
        }

        if(txt === 'kernel') {
            exec('uname -a;ptime;id;whoami',(err, sto) => {
                this._sendMessage(seq, sto);
            })
        }

        if(txt === 'kickall') {
            let { listMember } = await this.searchGroup(seq.to);
            for (var i = 0; i < listMember.length; i++) {
                if(listMember[i].mid != admin ){
                    this._kickMember(seq.to,[listMember[i].mid])
                }
            }
        }

        if(txt == 'pap'){
            // 
        }
    }
}

module.exports = new LINE();