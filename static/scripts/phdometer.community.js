//
// phdometer community interface
//
;
(function () {
    phdometer.community = phdometer.community || {
        shareActivity : function( activity ) {
            var data = typeof activity === 'string' || activity instanceof String ? JSON.parse(activity) : activity;
            return new Promise( function( resolve, reject ) {
                console.log( 'sharing : ' + activity );
                var result = {
                    command: 'status',
                    subject: 'shareactivity'
                };
                phdometer.rest.put( '/activity', data, {
                    onerror : function( evt ) {
                        result.status = 'error';
                        result.result = phdometer.rest.formaterror(evt);
                        console.log( JSON.stringify(result) );
                        reject( result );
                    },
                    onloadend : function( evt ) {
                        result.status = 'ok';
                        result.result = phdometer.rest.parseresponse(evt);
                        console.log( JSON.stringify(result) );
                        resolve( result );
                        location.reload();
                    }
                });
            });
        },
        modifyUserAccount : function( details ) {
            var data = typeof details === 'string' || details instanceof String ? JSON.parse(details) : details;
            return new Promise( function( resolve, reject ) {
               var result = {
                    command: 'status',
                    subject: 'modifyuseraccout'
                };
                phdometer.rest.put( '/user', data, {
                    onerror : function( evt ) {
                        result.status = 'error';
                        result.result = phdometer.rest.formaterror(evt);
                        console.log( JSON.stringify(result) );
                        reject( result );
                    },
                    onloadend : function( evt ) {
                        result.status = 'ok';
                        result.result = phdometer.rest.parseresponse(evt);
                        console.log( JSON.stringify(result) );
                        resolve( result );
                        location.reload();
                    } 
                });
            });
         },
        deleteUserAccount : function() {
            return new Promise( function( resolve, reject ) {
                var result = {
                    command: 'status',
                    subject: 'deleteuseraccout'
                };
                phdometer.rest.delete( '/user', {
                    onerror : function( evt ) {
                        result.result = phdometer.rest.formaterror(evt);
                        console.log( JSON.stringify(result) );
                        reject( result );
                    },
                    onloadend : function( evt ) {
                        result.status = 'ok';
                        result.result = phdometer.rest.parseresponse(evt);
                        console.log( JSON.stringify(result) );
                        resolve( result );
                        location.reload();
                    } 
                });
            });
        },
        postActivity : function( platform, text ) {
            var query = '?posttext=' + text;// + ' | #PhDometer #AcWriMo |';
            console.log( 'sharing : ' + query );
            location.href = '/share/post/' + platform + query;
        }
    }  
    var sharebuttons = document.querySelectorAll('.list_item_share');
    for ( var i = 0; i < sharebuttons.length; i++ ) {
        (function ( button ) {
            var platform = button.getAttribute('data-platform');
            var name = button.getAttribute('data-name');
            var type = button.getAttribute('data-type');
            var wordcount = button.getAttribute('data-wordcount');
            var time = button.getAttribute('data-time');
            var wordsperminute = button.getAttribute('data-wordsperminute');
            var text = 'Hooray! Making progress with ' + type + ' ' + name + ', ' + wordcount + ' words, ' + time + ', that is ' + wordsperminute + ' words per minute';
            button.onclick = function(evt) {
                phdometer.community.postActivity(platform,text);
            }
        })(sharebuttons[i]);
    }
    console.log(JSON.stringify({ subject: 'login', method: 'GET', status : 'OK', message : "logged in" }));
})();

