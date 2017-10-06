const Command = require('./command');
const { Message, OpType, Location } = require('../curve-thrift/line_types');





class LINE extends Command {
    constructor() {
        super();
        this.receiverID = '';
        this.checkReader = [];
        this.stateStatus = {
            cancel: 0,
            kick: 0,
        };
        this.messages;
        this.payload;
    }

    get myBot() {
        const bot = ['u78b179f959eba71ec2de09233281c49e','uc93c736a8b385208c2aa7aed58de2ceb','u236b88bf1eac2b90e848a6198152e647','u763977dab29cbd6fa0cbfa9f159b768b'];
        return bot; 
    }

    isAdminOrBot(param) {
        return this.myBot.includes(param);
    }

    getOprationType(operations) {
        for (let key in OpType) {
            if(operations.type == OpType[key]) {
                if(key !== 'NOTIFIED_UPDATE_PROFILE') {
                    console.info(`[* ${operations.type} ] ${key} `);
                }
            }
        }
    }

    poll(operation) {
        if(operation.type == 25 || operation.type == 26) {
            let message = new Message(operation.message);
            this.receiverID = message.to = (operation.message.to === this.myBot[0]) ? operation.message.from_ : operation.message.to ;
            Object.assign(message,{ ct: operation.createdTime.toString() });
            this.textMessage(message)
        }

        if(operation.type == 13 && this.stateStatus.cancel == 1) {
            this.cancelAll(operation.param1);
        }

        if(operation.type == 19) { //ada kick
            // op1 = group nya
            // op2 = yang 'nge' kick
            // op3 = yang 'di' kick
            if(this.isAdminOrBot(operation.param3)) {
                this._invite(operation.param1,[operation.param3]);
            }
            if(!this.isAdminOrBot(operation.param2)){
                this._kickMember(operation.param1,[operation.param2]);
            } 

        }

        if(operation.type == 55){ //ada reader
            const idx = this.checkReader.findIndex((v) => {
                if(v.group == operation.param1) {
                    return v
                }
            })
            if(this.checkReader.length < 1 || idx == -1) {
                this.checkReader.push({ group: operation.param1, users: [operation.param2], timeSeen: [operation.param3] });
            } else {
                for (var i = 0; i < this.checkReader.length; i++) {
                    if(this.checkReader[i].group == operation.param1) {
                        if(!this.checkReader[i].users.includes(operation.param2)) {
                            this.checkReader[i].users.push(operation.param2);
                            this.checkReader[i].timeSeen.push(operation.param3);
                        }
                    }
                }
            }
        }

        if(operation.type == 13) { // diinvite
            if(this.isAdminOrBot(operation.param2)) {
                return this._acceptGroupInvitation(operation.param1);
            } else {
                return this._cancel(operation.param1,this.myBot);
            }
        }
        this.getOprationType(operation);
    }

    command(msg, reply) {
        if(this.messages.text !== null) {
            if(this.messages.text === msg.trim()) {
                if(typeof reply === 'function') {
                    reply();
                    return;
                }
                if(Array.isArray(reply)) {
                    reply.map((v) => {
                        this._sendMessage(this.messages, v);
                    })
                    return;
                }
                return this._sendMessage(this.messages, reply);
            }
        }
    }

    async textMessage(messages) {
        this.messages = messages;
        let payload = (this.messages.text !== null) ? this.messages.text.split(' ').splice(1).join(' ') : '' ;
        let receiver = messages.to;
        let sender = messages.from;
        
        this.command('Halo', ['halo juga','ini siapa?']);
        this.command('kamu siapa', this.getProfile.bind(this));
        this.command('.status', `Your Status: ${JSON.stringify(this.stateStatus)}`);
        this.command(`.left ${payload}`, this.leftGroupByName.bind(this));
        this.command('.speed', this.getSpeed.bind(this));
        this.command('.kernel', this.checkKernel.bind(this));
        this.command(`kick ${payload}`, this.OnOff.bind(this));
        this.command(`cancel ${payload}`, this.OnOff.bind(this));
        this.command(`.kickall ${payload}`,this.kickAll.bind(this));
        this.command(`.cancelall ${payload}`, this.cancelMember.bind(this));
        this.command(`.set`,this.setReader.bind(this));
        this.command(`.recheck`,this.rechecks.bind(this));
        this.command(`.clearall`,this.clearall.bind(this));
        this.command('.myid',`Your ID: ${messages.from}`)
        this.command(`.ip ${payload}`,this.checkIP.bind(this))
        this.command(`.ig ${payload}`,this.checkIG.bind(this))
        this.command(`.qr ${payload}`,this.qrOpenClose.bind(this))
        this.command(`.joinqr ${payload}`,this.joinQr.bind(this));
        this.command(`.spam ${payload}`,this.spamGroup.bind(this));
        
        if(messages.contentType == 13) {
            messages.contentType = 0;
            this._sendMessage(messages,messages.contentMetadata.mid);
        }

        // if(cmd == 'lirik') {
        //     let lyrics = await this._searchLyrics(payload);
        //     this._sendMessage(seq,lyrics);
        // }

    }

}

module.exports = LINE;
