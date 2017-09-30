//
// facebook
//
var request = require('request');
var qs = require('qs');
var APP_ID = '763308053807322';
var APP_SECRET = '05d91aa704120bfcc8fdeca70b6e5ee2';
var CALLBACK_URL =  'http://' + ( process.env.OPENSHIFT_APP_DNS || 'localhost:3000' ) + '/share/callback/facebook';

function Facebook( credentials ) {
}

Facebook.prototype.post = function( req, res ) {
    req.session.facebook = req.session.facebook || {};
    req.session.facebook.posttext = decodeURIComponent( req.query.posttext );
    res.redirect('/share/authorise/facebook');
}

Facebook.prototype.authorise = function( req, res ) {
    req.session.facebook = req.session.facebook || {};
    req.session.facebook.state = Math.floor( Math.random()*1e19);
    var params = {
        client_id : APP_ID,
        redirect_uri : CALLBACK_URL,
        state : req.session.facebook.state,
        scope: 'publish_actions'
    }
    var login_url = 'https://www.facebook.com/v2.8/dialog/oauth?' + qs.stringify(params,{ encode: false });
    //console.log( 'facebook authorise : redirecting to : ' + login_url );
    res.redirect(login_url);
}

Facebook.prototype.callback = function( req, res ) {    
    var state = req.query.state;
    if ( state == req.session.facebook.state ) {
        var code = req.query.code;
        if ( code ) {
            var params = {
                url: 'https://graph.facebook.com/oauth/access_token',
                qs : {
                    client_id : APP_ID,
                    redirect_uri : CALLBACK_URL,
                    client_secret : APP_SECRET,
                    code: code
                }
            };
            request.get( params, function(error, response, body ) {
                //console.log( 'connected to facebook, body : ' + body );
                if ( error ) {
                    // error
                    console.log( 'error connecting to facebook : ' + JSON.stringify(error) );
                } else {
                    var results = qs.parse(body); // TODO: check if body is JSON as this will be an error
                    req.session.facebook = req.session.facebook || {};
                    req.session.facebook.access_token = results.access_token;
                    req.session.facebook.expires = results.expires;
                    //console.log( 'connected to facebook posting : ' + req.session.facebook.posttext );
                    var params = {
                        url : 'https://graph.facebook.com/me/feed',
                        qs : {
                            access_token : req.session.facebook.access_token,
                            message : req.session.facebook.posttext
                        }
                    };
                    //console.log( 'posting to facebook : ' + JSON.stringify( params ) );
                    request.post( params, function( error, response, body ) {
                        console.log( 'posted to facebook, body : ' + body );
                        var json = JSON.parse( body );
                        if (error) {
                            // something went wrong 
                            console.log( 'error posting to facebook : ' + JSON.stringify(error) );
                            res.redirect('/community');
                        } else if ( body.error ) {
                            console.log( 'error posting to facebook : ' + body.error );
                            res.redirect('/community');
                        } else {
                            // data contains the data sent by twitter 
                            res.redirect('/community');
                        }
                    });
                }
            });
        } else {
            // error
            console.log( 'error posting to facebook : no authentication code returned' );
            res.redirect('/community');
        }
    } else {
        // error
        console.log( 'error posting to facebook : incorrect session state' );
        res.redirect('/community');
    }
}

module.exports = {
    create : function(credentials) {
        return new Facebook( credentials );
    }
}
