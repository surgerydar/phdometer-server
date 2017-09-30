//
// twitter
//
var twitterAPI = require('node-twitter-api');
var APP_ID = 'ghhHfU0Ze9gcuHVJmdDoVv1Ly';
var APP_SECRET = 'a0ARVhoKwNzepcwU2Q7yuXPi5ycCRIieLYiGatvzH4HhDCoKfi';
var CALLBACK_URL =  'http://' + ( process.env.OPENSHIFT_APP_DNS || 'localhost:3000' ) + '/share/callback/twitter';
function Twitter( credentials ) {
     this.twitter = new twitterAPI({
        consumerKey: APP_ID,
        consumerSecret: APP_SECRET,
        callback: CALLBACK_URL
    });
}

Twitter.prototype.post = function( req, res ) {
    req.session.twitter = req.session.twitter || {};
    req.session.twitter.posttext = decodeURIComponent( req.query.posttext );
    res.redirect('/share/authorise/twitter');
}

Twitter.prototype.authorise = function( req, res ) {
    this.twitter.getRequestToken(function(error, requestToken, requestTokenSecret, results){
        if (error) {
            console.log("Error getting OAuth request token : " + error);
        } else {
            //store token and tokenSecret somewhere, you'll need them later; redirect user 
            req.session.twitter = req.session.twitter || {};
            req.session.twitter.token = requestToken,
            req.session.twitter.secret = requestTokenSecret
            res.redirect( 'https://twitter.com/oauth/authenticate?oauth_token=' + requestToken );
        }
    });
}

Twitter.prototype.callback = function( req, res ) {
    var self = this;
    var oauth_verifier = req.query.oauth_verifier;
    self.twitter.getAccessToken(req.session.twitter.token, req.session.twitter.secret, oauth_verifier, function(error, accessToken, accessTokenSecret, results) {
        if (error) {
            console.log(error);
        } else {
            //store accessToken and accessTokenSecret somewhere (associated to the user) 
            //Step 4: Verify Credentials belongs here 
            req.session.twitter = req.session.twitter || {};
            req.session.twitter.access_token = accessToken;
            req.session.twitter.access_token_secret = accessTokenSecret;
            //console.log( 'got twitter access token' );
            self.twitter.statuses("update", {
                    status: ( req.session.twitter.posttext || "Testing PhDometer Post!" ) + ' , #PhDometer #AcWriMo' 
                },
                accessToken,
                accessTokenSecret,
                function(error, data, response) {
                    if (error) {
                        // something went wrong 
                        console.log( 'error posting to twitter : ' + JSON.stringify(error) );
                        res.redirect('/community');
                    } else {
                        // data contains the data sent by twitter 
                        res.redirect('/community');
                    }
                }
            );
        }
    });    
}

module.exports = {
    create : function(credentials) {
        return new Twitter( credentials );
    }
}
