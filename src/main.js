import { LineAPI } from './api';
import { Message, OperationType } from '../curve-thrift/line_types';
// import redis from 'redis';
// const redisClient = redis.createClient({port: process.env.PORT || 7677 });

let exec = require('child_process').exec;

const myBot = ['uc93c736a8b385208c2aa7aed58de2ceb','u236b88bf1eac2b90e848a6198152e647'];


function isAdminOrBot(param) {
    return myBot.includes(param);
}


class LINE extends LineAPI {
    constructor() {
        super();
        this.receiverID = '';
        this.checkReader = [];
        this.stateStatus = {
            cancel: 0,
            kick: 0,
        }
    }

    getOprationType(operations) {
        for (let key in OperationType) {
            if(operations.type == OperationType[key]) {
                if(key !== 'NOTIFIED_UPDATE_PROFILE') {
                    console.log(`[* ${operations.type} ] ${key} `);
                }
            }
        }
    }

    poll(operation) {
        if(operation.type == 25 || operation.type == 26) {
            const txt = (operation.message.text !== '' && operation.message.text != null ) ? operation.message.text.toLowerCase() : '' ;
            let message = new Message(operation.message);
            this.receiverID = message.to = (operation.message.to === myBot[0]) ? operation.message.from_ : operation.message.to ;
            Object.assign(message,{ ct: operation.createdTime.toString() });
            this.textMessage(txt,message)
        }

        if(operation.type == 13 && this.stateStatus.cancel == 1) {
            this.cancelAll(operation.param1);
        }

        if(operation.type == 19) { //ada kick
            if(!isAdminOrBot(operation.param2)){
                this._kickMember(operation.param1,[operation.param2]);
                if(isAdminOrBot(operation.param3)) {
                    this._invite(operation.param1,myBot);
                }
            }

        }

        if(operation.type == 28){ //ada reader
            let checkReader = this.checkReader;
            for (let i = 0; i < checkReader.length; i++) {
                for (let key in checkReader[i]) {
                    let oparam2 = operation.param2.split('\u001e');
                    if(oparam2.includes(checkReader[i].messageId)) {
                        let usersList = checkReader[i].users;
                        let timeList = checkReader[i].timeSeen;
                        if(!usersList.includes(operation.param1)){
                            usersList.push(operation.param1);
                            timeList.push(operation.createdTime.toString());
                        }
                    }
                }                
            }
            
        }

        if(operation.type == 13) { // diinvite
            if(isAdminOrBot(operation.param2)) {
                return this._acceptGroupInvitation(operation.param1);
            } else {
                return this._cancel(operation.param1,myBot);
            }
        }
        this.getOprationType(operation);
    }

    searchReader(seq) {
        const messageID = seq.id;
        let groupID = seq.to;
        let dataReader = { 
            messageId: messageID,
            group: groupID,
            users: [],
            timeSeen: [],
        };

        if(myBot.includes('uc93c736a8b385208c2aa7aed58de2ceb')) {
            this.checkReader.push(dataReader);
        }
    }

    async cancelAll(gid) {
        let { listPendingInvite } = await this.searchGroup(gid);
        if(listPendingInvite.length > 0){
            this._cancel(gid,listPendingInvite);
        }
    }

    async searchGroup(gid) {
        let listPendingInvite = [];
        let thisgroup = await this._getGroups([gid]);
        if(thisgroup[0].invitee !== null) {
            listPendingInvite = thisgroup[0].invitee.map((key) => {
                return key.mid;
            });
        }
        let listMember = thisgroup[0].members.map((key) => {
            return { mid: key.mid, dn: key.displayName };
        });

        return { 
            listMember,
            listPendingInvite
        }
    }

    removeReaderByGroup(groupID) {
        let i = 0;
        this.checkReader.map((v) => {
            if(v.group == groupID) {
                this.checkReader.splice(i,1);
            }
            i++
        })
    }
    
    setState(seq) {
        if(isAdminOrBot(seq.from)){
            let [ actions , status ] = seq.text.split(' ');
            const action = actions.toLowerCase();
            const state = status.toLowerCase() == 'on' ? 1 : 0;
            this.stateStatus[action] = state;
            this._sendMessage(seq,`Status: \n${JSON.stringify(this.stateStatus)}`);
        } else {
            this._sendMessage(seq,`You Are Not Admin`);
        }
    }

    async recheck(cs,group) {
        let users;
        for (var i = 0; i < cs.length; i++) {
            if(cs[i].group == group) {
                users = cs[i].users;
            }
        }

        let contactMember = await this._getContacts(users);
        return contactMember.map((z) => {
                return z.displayName;
            }).join(',');
    }

    async textMessage(txt, seq) {
        const messageID = seq.id;

        if(txt == 'cancel' && this.stateStatus.cancel == 1) {
            this.cancelAll(seq.to);
        }

        if(txt == 'halo' || txt == 'sya') {
            this._sendMessage(seq, 'halo disini tasya :)');
        }

        if(txt == 'speed') {
            const curTime = Math.floor(Date.now() / 1000);
            this._sendMessage(seq,'processing....');
            const rtime = Math.floor(Date.now() / 1000) - curTime;
            this._sendMessage(seq, `${rtime} second`);
        }

        if(txt === 'kernel') {
            exec('uname -a;ptime;id;whoami',(err, sto) => {
                this._sendMessage(seq, sto);
            })
        }

        if(txt === 'kickall' && this.stateStatus.kick == 1) {
            let { listMember } = await this.searchGroup(seq.to);
            for (var i = 0; i < listMember.length; i++) {
                if(!isAdminOrBot(listMember[i].mid)){
                    this._kickMember(seq.to,[listMember[i].mid])
                }
            }
        }

        if(txt == 'setpoint') {
            this._sendMessage(seq, `SetPoint for check Reader .`);
            this.removeReaderByGroup(seq.to);
        }

        if(txt == 'recheck'){
            let rec = await this.recheck(this.checkReader,seq.to);
            let xz = rec.split(',');
            this._sendMessage(seq, `== tukang bengong ==\n${xz.join('\n')}`);
            
        }

        if(txt == 'setpoint for check reader .') {
            this.searchReader(seq);
        }

        if(txt == 'clearall') {
            this.checkReader = [];
        }

        if(txt == 'cancel on') {
            this.setState(seq)
        }

        if(txt == 'cancel off') {
            this.setState(seq)
        }
        if(txt == 'kick on') {
            this.setState(seq)
        }

        if(txt == 'kick off') {
            this.setState(seq)
        }

    }

}

module.exports = new LINE();