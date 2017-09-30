var env = process.env;
//
//
//
var express = require('express');
var bodyparser = require('body-parser');
var cookieparser = require('cookie-parser');
var passport = require('passport');
var flash = require('connect-flash');
var expresssession = require('express-session');
var mongostore = require('connect-mongo')(expresssession);
var objectid = require('mongodb').ObjectID;
//
//
//		
var app = express();
//
//
//
var mailer = require('./phdometer.email.js');
//
//
//
var share_credentials = require('./share-config.json')
//var share = require('./phdometer.share.js');
var shares = {
    twitter : require('./phdometer.twitter.js').create( share_credentials.twitter ),
    facebook : require('./phdometer.facebook.js').create( share_credentials.twitter )
};
//
// connect to database
//
var db = require('./phdometer.db.js');
db.connect(
    /*
	env.OPENSHIFT_MONGODB_DB_HOST,
	env.OPENSHIFT_MONGODB_DB_PORT,
	env.OPENSHIFT_APP_NAME,
	env.OPENSHIFT_MONGODB_DB_USERNAME,
	env.OPENSHIFT_MONGODB_DB_PASSWORD
    */
	env.MONGODB_DB_HOST,
	env.MONGODB_DB_PORT,
	env.MONGODB_DATABASE,
	env.MONGODB_USER,
	env.MONGODB_PASSWORD
).then( function( db_connection ) {
    //
    // configure express
    //
    console.log( 'configuring server' );
    app.use(bodyparser.json());
    app.use(bodyparser.urlencoded({'limit': '5mb', 'extended': false }));
	app.use(cookieparser('unusual*windy'));
	app.set('view engine', 'pug');
	app.use(expresssession({
		secret: 'unusual*windy', 
		saveUninitialized: false, resave: false, 
		cookie: { httpOnly: false, maxAge: 36000000 },
		store: new mongostore({ db : db.db })
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(flash());
    app.use(express.static(__dirname+'/static'));
	//
	// initialise authentication
	//
	var mymusic_pasport = require('./phdometer.passport.js')(passport,db);
	//
	// authentication redirect
	//
	function is_loggedin(req, res, next) {
        if ( req.user && req.isAuthenticated() ) {
            //console.log( 'authenticated with user : ' + JSON.stringify( req.user ) );
			return next();
		} else {
			//console.log(req.user);
			if( req.method !== 'GET' ) {
                var subject = req.path.substring( 1 );
				// ajax requests get a brief response
				console.log( 'rejecting xhr request' );
				res.status(401).json({ subject: subject, method: req.method, status : 'ERROR', message : 'please login' });
			} else {
				// all others are redirected to signin
				//console.log( 'redirecting to login' );
				res.redirect('/login');
			}
		}
	}
 	//
	// pasport routes
	//
	app.get('/login', function(req, res) {
		res.render('login', { title: 'PhDometer - login', message: req.flash('message') });
	});
	app.post('/login', passport.authenticate('login', {
			successRedirect: '/community',
			failureRedirect: '/login',
			failureFlash : 'true' 
		})
	);
	app.get('/signup', function(req, res){
		res.render('register',{ title: 'PhDometer - signup', message: req.flash('message')});
	});
	app.post('/signup', passport.authenticate('signup', {
			successRedirect: '/community',
			failureRedirect: '/signup',
			failureFlash : 'true' 
		})
	);
    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/login');
    });
    app.get('/recoverpassword', function(req, res){
        var stage = req.query.recoverystage || 'emailuser';
        var id = stage == 'resetpassword' ? req.query.id : '';
        res.render('recoverpassword',{ title: 'PhDometer - recover password', recoverystage: stage, id: id, message: ''});
    });
    app.post('/recoverpassword', function(req, res){
        var recoverystage = req.body.recoverystage;
        switch( recoverystage ) {
            case 'emailuser' :
                var query = { email : req.body.email };
                db.findUser(query).then( function( user ) {
                    console.log( 'sending mail to ' + req.body.email );
                    var message = 'follow link to reset your password:\n';
                    if ( env.OPENSHIFT_APP_DNS ) {
                        message += 'http://' + env.OPENSHIFT_APP_DNS + '/recoverpassword?recoverystage=resetpassword&id=' + user._id
                    } else {
                        message += 'http://' + 'localhost:3000' + '/recoverpassword?recoverystage=resetpassword&id=' + user._id
                    }
                    mailer.send( req.body.email, 'Recover Password', message ).then( function(result) {
                        console.log( 'sent mail to ' + req.body.email );
                        res.render('message',{ title: 'PhDometer - recover password', subject: 'Recover Password', message: 'an email has been sent, check your inbox for instructions to reset your password', link : '/login', linktext : 'back to login'});
                    }).catch( function( error ) {
                        console.log( 'unable to send mail to ' + req.body.email + ' : ' + error );
                        res.render('recoverpassword',{ title: 'PhDometer - recover password', recoverystage: 'emailuser', message: 'unable to send email specified', link : '/recoverpassword', linktext : 'recover password'});
                    });
                } ).catch( function( error ) {
                    console.log( 'unable to find user with email ' + req.body.email + ' : ' + error );
                    res.render('recoverpassword',{ title: 'PhDometer - recover password', recoverystage: 'emailuser', message: 'unknown email', link : '/recoverpassword', linktext : 'recover password'});
                } );
                break;
            case 'resetpassword' :
                var user = {
                    _id : new objectid(req.body.id),
                    password : req.body.password
                };
                db.putUser( user ).then( function( response ) {
                    res.render('message',{ title: 'PhDometer - recover password', subject: 'Recover Password', message: 'password reset', link : '/login', linktext : 'login'});
                } ).catch( function( err ) {
                    res.render('message',{ title: 'PhDometer - recover password', subject: 'Recover Password', message: 'unable to reset password : ' + err, link : '/recoverpassword', linktext : 'recover password' });
                } );
                break;
        }
    });
    //
    // share routes
    //
    app.get('/share/post/:platform', is_loggedin, function( req, res ) {
        var platform = req.params.platform;
        //console.log( 'sharing to ' + platform );
        if ( platform && shares[ platform ] ) {
            shares[ platform ].post( req, res );
        } else {
            res.render('message',{ title: 'PhDometer - share', subject: 'Share Activity', message: 'unknown platform : ' + platform, link : '/community', linktext : 'back' });
        }
    });
    app.get('/share/authorise/:platform', is_loggedin, function( req, res ) {
        var platform = req.params.platform;
        //console.log( 'sharing to ' + platform );
        if ( platform && shares[ platform ] ) {
            shares[ platform ].authorise( req, res );
        } else {
            res.render('message',{ title: 'PhDometer - share', subject: 'Share Activity', message: 'unknown platform : ' + platform, link : '/community', linktext : 'back' });
        }
    });
    app.get('/share/callback/:platform', is_loggedin, function( req, res ) {
        var platform = req.params.platform;
        if ( platform && shares[ platform ] ) {
            shares[ platform ].callback( req, res );
        } else {
            res.render('message',{ title: 'PhDometer - share', subject: 'Share Activity', message: 'unknown platform : ' + platform, link : '/community', linktext : 'back' });
        }
    });
    //
    // App routes
    //
    //
    // GET
    //
    function getLeaderBoard(res) {
        return new Promise( function( resolve, reject ) {
            var leaderboard = {};
            db.getActivityList({type:'Writing'},{wordsperminute:-1}).then(function(result){
                leaderboard.writing = result;
                db.getActivityList({type:'Drafting'},{wordsperminute:-1}).then(function(result){
                    leaderboard.drafting = result;
                    db.getActivityList({type:'Editing'},{time:-1}).then(function(result){
                        leaderboard.editing = result;
                        db.getActivityList({type:'Proofreading'},{time:-1}).then(function(result){
                            leaderboard.proofreading = result;
                            db.getActivityList({type:'Note Taking'},{time:-1}).then(function(result){
                                leaderboard.notetaking = result;
                                resolve( leaderboard );
                            }).catch(function(err){
                                res.json( { status : 'ERROR', message : err } );
                            });
                        }).catch(function(err){
                            res.json( { status : 'ERROR', message : err } );
                        });
                    }).catch(function(err){
                        res.json( { status : 'ERROR', message : err } );
                    });
                }).catch(function(err){
                    res.json( { status : 'ERROR', message : err } );
                });
            }).catch(function(err){
                res.json( { status : 'ERROR', message : err } );
            });
        });
    }
    console.log( 'configuring routes' );
    app.get('/', function (req, res) {
        //console.log( 'GET /' );
        getLeaderBoard(res).then(function(result) {
            res.render('index', { title: 'PhDometer 3.0', leaderboard : result } );
        }).catch( function(err) {
            res.json( { status : 'ERROR', message : err } );   
        });
    });
    app.get('/community', is_loggedin, function (req, res) {
        //console.log( 'GET /' );
        db.getActivityList({username:req.user.username},{}).then( function( result ) {
            var data = { 
                title: 'PhDometer 3.0', 
                myactivities : result, 
            };
            getLeaderBoard(res).then(function(result){
                data.leaderboard = result;
                res.render('community',data);
            }).catch(function(err){
                res.json( { status : 'ERROR', message : err } );
            });
        } ).catch( function( err ) {
            res.json( { status : 'ERROR', message : err } );
        });
    });
    app.get('/app/:filename', function( req, res ) {
        var filename = req.params.filename;
        var path = process.env.OPENSHIFT_DATA_DIR + '/' + filename;
        console.log( 'downloading : ' + path );
        res.download( path );
    });
    
    // TODO: remove for release
    app.get('/drop/:collection', function( req, res ) {
        var collection = req.params.collection;
        db.drop(collection).then( function( result ) {
            res.json( { status : 'OK', message : 'collection ' + collection + ' dropped' } );
        } ).catch( function( err ) {
            res.json( { status : 'ERROR', message : JSON.stringify(err) } );
        });
    });
    //
    // PUT
    //
    app.put('/activity', is_loggedin, function(req, res) {
        //console.log( "PUT /activity " + JSON.stringify(req.body) );
        var activity = req.body;
        var subject = req.path.substring( 1 );
        activity.username = req.user.username;
        if ( activity ) {
            db.putActivity( activity ).then( function( response ) {
                res.json( { subject: subject, method: req.method, status : 'OK', message : 'added activity : ' + activity.name } );
            } ).catch( function( err ) {
                res.json( { subject: subject, method: req.method, status : 'ERROR', message : JSON.stringify( err ) } );
            } );
        } else {
            res.json( { subject: subject, method: req.method, status : 'ERROR', message : "empty activity" } );
        }
    });
    app.put('/user', is_loggedin, function(req, res) {
        //console.log( "PUT /user " + JSON.stringify(req.body) );
        var user = req.body;
        user.username = req.user.username;
        var subject = req.path.substring( 1 );
        if ( user ) {
            db.putUser( user ).then( function( response ) {
                res.json( { subject: subject, method: req.method, status : 'OK', message : 'updated user : ' + user.username  } );
            } ).catch( function( err ) {
                res.json( { subject: subject, method: req.method, status : 'ERROR', message : JSON.stringify( err ) } );
            } );
        } else {
            res.json( { subject: subject, method: req.method, status : 'ERROR', message : "empty user" } );
        }
    });
    

}).catch( function( err ) {
	console.log( 'unable to connect to database : ' + err );
});
//
// start app
//
console.log( 'starting application' );
app.listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost', function () {
  console.log('Application worker ' + process.pid + ' started...');
});
