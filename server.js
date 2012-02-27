var fs = require('fs');
var qs = require('querystring');
var url = require('url');
var http = require('http');
var path = require('path');

var Cookies = require('./cookies');
var Session = require('./session');
var mime    = require('./mime');

function static(req,resp){
    var p = path.normalize(req.info.pathname);
    if(p=="/")p="/index.html";
    if(!(/^\/static/.test(p))){
        p = "/static" + p;
    }
    p = "."+p;
    //console.info(p);
    var stat = null;
    try{
    	stat = fs.statSync(p);
    }catch(e){}
    if(!stat || !stat.isFile()){
        resp.writeHead(404);
        resp.end("<html><body><h1>?_? Not found</h1></body></html>");
        return;
    }
    var mtime = req.headers['if-modified-since'];
    if(mtime){
        if(mtime == stat.mtime.toString()){
            resp.writeHead(304,{
    	        'Date'          : stat.ctime.toString(),
            	'Last-Modified' : stat.mtime.toString(),
    	        'Cache-Control' : 'max-age=31536000',
            });
            resp.end();
            return;
        }
    }
    resp.writeHead(200,{
    	'Content-Length': stat.size,
    	'Content-Type'  : mime.mime_type(p),
    	'Date'          : stat.ctime.toString(),
    	'Last-Modified' : stat.mtime.toString(),
    	'Cache-Control' : 'max-age=31536000',
    });
    if(req.head=='HEAD'){
        resp.end();
        return;
    }
    var s = fs.createReadStream(p);
    s.on("end", function() {
        resp.end();
    });
    s.on("error", function(e) {
    	console.info(e);
        resp.end();
    });
    s.pipe(resp);
}

function KumaServer(dispatch_table,cookies_key,session_config){
    function disaptch(request, response) {
        console.info("%s %s %s",request.connection.remoteAddress,request.method,request.url);
        request.cookies = new Cookies(request,response,cookies_key);
        request.session = new Session(request.cookies ,session_config.timeout,session_config.key);

        request.info = url.parse(request.url,true);
        response.setHeader("Server","KumaChan4JS/1.1.0");
        var handler; 
        for(var path in dispatch_table){
            if(typeof(path)=='string' && path == request.info.pathname){
                handler = dispatch_table[path];
                break;
            }else if(path instanceof RegExp && path.test(request.info.pathname)){
                handler = dispatch_table[path];
                break;
            }
        }
        if(handler){
            handler(request,response);
        }else{
            static(request,response);
        }
    }
    var server = http.createServer(disaptch);
    return server; 
}

module.exports = KumaServer
