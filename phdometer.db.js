//
// database
//
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var bcrypt = require('bcryptjs');

function formatTime(seconds) {
    var time = Number.parseInt( seconds );
    function pad( string, length ) {
        while( string.length < length ) string = "0" + string;
        return string;
    }
    //
    //
    //
    var hours = Math.floor( seconds / ( 60 * 60 ) );
    var minutes = Math.floor( ( seconds - ( hours * 60 * 60 ) ) / 60 );
    var seconds = seconds - ((minutes*60)+(hours*60*60))

    var string = "";
    if ( hours > 0 ) {
        string += pad(hours.toString(), 2 ) + ":";
    }
    if ( minutes > 0 ) {
        string += pad(minutes.toString(), 2 ) + ":";
    }
    string += pad(seconds.toString(),2);

    return string;
}

function Db() {
}

Db.prototype.connect = function( url, host, port, database, username, password ) {
	host 		= host || '127.0.0.1';
	port 		= port || '27017';
	database 	= database || 'phdometer';
	var authentication = username && password ? username + ':' + password + '@' : '';
	url = url || host + ':' + port + '/' + database;
	console.log( 'connecting to mongodb://' + authentication + url );
	var self = this;
	return new Promise( function( resolve, reject ) {
		try {
			MongoClient.connect('mongodb://'+ authentication + url, function(err, db) {
				if ( !err ) {
					console.log("Connected to database server");
					self.db = db;
					resolve( db );
				} else {
					console.log("Unable to connect to database : " + err);
					reject( err );
				}
			});
		} catch( err ) {
			reject( err );
		}
	});
}

Db.prototype.getActivityList = function( search, sort ) {
	var db = this.db;
	return new Promise( function( resolve, reject ) {
		try {
            //
            //
            //
            //console.log('getActivityList : find');
            var cursor = db.collection( 'activity' ).find(search || {});
            if ( sort ) {
                cursor.sort( sort );
            }
            //
            //
            //
            //console.log('getActivityList : building item list')
            var items = [];
            cursor.each(function( err, item ) {
                if ( err ) {
                    reject( err );
                } else if ( item ) {
                    //console.log( JSON.stringify( item ) );
                    item.time = formatTime( item.time ); // JONS: not a good idea but fulfills requirement
                    items.push( item );
                } else {
                    resolve( items );
                }
            });
		} catch( err ) {
			reject( err );
		}
	} );
}

Db.prototype.putActivity = function( activity ) {
	var db = this.db;
    //console.log( 'putActivity : inserting : ' + JSON.stringify(activity) );
	return new Promise( function( resolve, reject ) {
		try {
            db.collection( 'activity' ).findOneAndUpdate( { activity_id: activity.activity_id }, { $set: activity },
                                                                { upsert: true }, function( error, response ) {
                if ( error ) {
                    console.log( 'putActivity : upsert failed' );
                    reject( error );
                } else {
                    //console.log( 'putActivity : upsert ok : ' + JSON.stringify( response ) );
                    resolve( response );
                }
            } );
		} catch( error ) {
            console.log( 'putActivity : general error' );
			reject( error );
		}
	} );
}

Db.prototype.drop = function(collection) {
    var db = this.db;
    return new Promise( function( resolve, reject ) {
		try {
            db.collection( collection ).drop( function( error, response ) {
                if ( error ) {
                    console.log( 'drop failed' + JSON.stringify( response ) );
                    reject( error );
                } else {
                    //console.log( 'drop ok : ' + JSON.stringify( response ) );
                    resolve( response );
                }
            } );
		} catch( error ) {
            console.log( 'drop : general error : ' + JSON.stringify( error ) );
			reject( error );
		}
	} );
}
//
// user collection
//
Db.prototype.addUser = function( user ) {
	//console.log( "addUser(" + JSON.stringify( user ) + ")" );	
    var self = this;
	var db = this.db;
	return new Promise( function( resolve, reject ) {
		try {
			db.collection( 'user' ).insertOne(user, function( error, result ) {
				if ( error ) {
					reject( error );
				} else {
                    //console.log( 'add user result : ' + JSON.stringify( result ) );
                    var new_user = self.findUser( {username: user.username} );
                    //console.log( 'user entry : ' + JSON.stringify( new_user ) );
					resolve( new_user );
				}
			});
		} catch( error ) {
			console.log( "addUser : exception : " + JSON.stringify( error ) );
			reject( error );
		}
	} );
}

Db.prototype.findUser = function( user ) {
	//console.log( "findUser(" + JSON.stringify( user ) + ")" );	
	var db = this.db;
	return new Promise( function( resolve, reject ) {
		try {
			var found = db.collection( 'user' ).find(user).limit(1).toArray( function( error, users ) {
				if ( error ) {
					reject( error );
				} else if ( users.length == 1 ) {
					//console.log( "found user : " + JSON.stringify( users[ 0 ] ) );
					resolve( users[ 0 ] );
				} else {
					console.log( "unable to find user : " + JSON.stringify( user ) );
					resolve( null );
				}
			});
		} catch( error ) {
			console.log( "findUser : exception : " + JSON.stringify( error ) );
			reject( error );
		}
	} );
}
Db.prototype.putUser = function( user ) {
	var db = this.db;
    //console.log( 'putUser : updating : ' + JSON.stringify(user) );
    user.password = bcrypt.hashSync(user.password, 10);
	return new Promise( function( resolve, reject ) {
		try {
            var query = {};
            if ( user._id ) {
                query = { _id : user._id };
                delete user._id; // remove id for update
                //console.log( 'putUser : removed _id : ' + JSON.stringify(user) );
            } else if ( user.username ) {
                query = { username : user.username };
            } else if ( user.email ) {
                query = { email : user.email };
            }
            db.collection( 'user' ).findOneAndUpdate( query, { $set: user },
                                                                { upsert: false }, function( error, response ) {
                if ( error ) {
                    console.log( 'putUser : update failed' );
                    reject( error );
                } else {
                    //console.log( 'putUser : update ok : ' + JSON.stringify( response ) );
                    resolve( response );
                }
            } );
		} catch( error ) {
            console.log( 'putUser : general error' );
			reject( error );
		}
	} );
}

module.exports = new Db();

