var localstrategy = require( 'passport-local' ).Strategy;
var bcrypt = require('bcryptjs');
var objectid = require('mongodb').ObjectID;

module.exports = function(passport,db) {
	//
	// user serialisation
	//
    passport.serializeUser(function(user, done) {
        //console.log( 'serialising user : ' + JSON.stringify( user ) );
        done(null, user._id);        
    });
    passport.deserializeUser(function(id, done) {
    	//console.log('deserializing user : ' + id );
    	db.findUser( { _id : new objectid( id ) } ).then( function( user ) {
    		//console.log( 'found user : ' + JSON.stringify( user ) );
    		done(null, user);
    	}).catch( function( err ) {
    		console.log( 'unable to find user : ' + err );
    		done(err);
    	});
    });
    //
    // login
    //
	passport.use('login', new localstrategy({
				passReqToCallback : true
			},
			function(req, username, password, done) { 
				db.findUser({ username: username }).then( function( user ) {
					//
					// valid username ?
					//
					if (!user) { 
						console.log('login : user not found : ' + username);
						//return done(null, false, req.flash('message', 'User Not found.'));                 
						return done(null, null, req.flash('message', 'invalid username or password'));                 
					}
					//
					// valid password
					//
					if (!validate_password(user, password)){
						console.log('invalid password');
						//return done(null, false, req.flash('message', 'Invalid Password')); // redirect back to login page
						return done(null, null, req.flash('message', 'invalid username or password')); // redirect back to login page
					}
					//
					// valid login
					//
					return done(null, user);
				}).catch( function( err ) {
					return done(err);
				}); 
			}
		)
    );
    var validate_password = function(user, password){
        return bcrypt.compareSync(password, user.password);
    }
	//
	// signup
	//    
	passport.use('signup', new localstrategy({
        // allows us to pass back the entire request to the callback
		passReqToCallback : true 
	},
	function(req, username, password, done) {
			var findOrCreateUser = function() {
            	//
            	// check if user exists
            	//
                var query = { $or : [ { username : username }, { email : req.body.email }]};
            	db.findUser(query).then( function( user ) {
					if ( user ) {
                        
                        var message = username == user.username ? 
                            "Username '" + username + "' is already registered" : 
                            "Email address '" + req.body.email + "' is already registered";
                        //console.log(message);
                        return done(null, false, req.flash('message', message));					
					} else {
						var new_user = {
                        	username: 	username,
                        	password: 	create_hash(password),
                        	email: 		req.body.email,
                        	firstName:	req.body.firstName,
                        	lastName:	req.body.lastName
						};
						//
						//
						//
						db.addUser( new_user ).then( function( user ) {
							//console.log( 'added user : ' + JSON.stringify( user ) );
							return done( null, user );
						}).catch( function( err ) {
                            console.log( 'error adding user : ' + JSON.stringify( err ) );
							return done(err);
						});
					}            		
            	}).catch( function( err ) {
            		console.log( 'error finding user : ' + username );
            		done( err );
            	});
            };
            // Delay the execution of findOrCreateUser and execute the method
            // in the next tick of the event loop
            // why?
            process.nextTick(findOrCreateUser);
        })
    );
    //
    // generate hash using bcrypt
    //
    var create_hash = function(password){
        return bcrypt.hashSync(password, 10);
    }

	
}