//
// phdometer social media interface
//
var oauth2 = require('simple-oauth2');
function Share( credentials ) {
    this.oauth = oauth2.create(credentials);
    this.credentials = credentials;
}

Share.prototype.authorise = function( req, res ) {
    var self = this;
    var authorizationUri = self.oauth.authorizationCode.authorizeURL({
      redirect_uri: 'http://localhost:3000/share/post/' + req.params.platform,// + '?text=' + encodeURIComponent(req.query.posttext),
      scope: 'post'
    });
    
    res.redirect(authorizationUri);
}
Share.prototype.post = function( req, res ) {
    res.json( req.query );
}

module.exports = {
    create : function(credentials) {
        return new Share( credentials );
    }
}

