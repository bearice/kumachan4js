var crypto = require('crypto');
var sessions = {};
var session_seq = Math.floor(Math.random()*1000000);

function Session(cookies,timeout,key){
    this.cookies = cookies;
    this.timeout = timeout;
    this.key = key;
    this.id  = cookies.get("session_id");
    if(!this.id || !sessions[this.id]){
        this.genSessionId();    
    }
}

function resetSessionTimeout(session){
    if(session.timeoutId){
    	clearTimeout(session.timeoutId);
    }
    session.timeoutId = setTimeout(function(){
        sessions[session.id] = null;
    },session.timeout);
}

Session.prototype.genSessionId = function(){
    var hmac = crypto.createHmac("sha1", this.key);
    hmac.update(String(session_seq++));
    this.id = hmac.digest('hex');
    this.cookies.set("session_id",this.id);
    var session = {
        timeout : this.timeout,
        values : {},
        id : this.id,
    };
    sessions[this.id] = session;
    resetSessionTimeout(session);
}

Session.prototype.clear = function(){
    if(this.id){
        var session = sessions[this.id];
        if(session){
        	sessions[this.id] = null;
        	clearTimeout(session.timeoutId);
        }
    }
    this.genSessionId();
}

Session.prototype.get = function(key){
    //console.info(sessions);
    if(this.id){
        var session = sessions[this.id];
        if(session){
        	resetSessionTimeout(session);
            return session.values[key];
        }
    }
    return null;
}

Session.prototype.set = function(key,val){
    if(!this.id){
        this.genSessionId();    
    }
    var session = sessions[this.id];
    if(session){
        resetSessionTimeout(session);
        session.values[key] = val;
        return;
    }
}

module.exports = Session;
