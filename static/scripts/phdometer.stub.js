/*
    PhDometer stub
*/
;
phdometer = {};
(function () {
    phdometer.community = phdometer.community || {
        shareActivity : function( activity ) {
            console.log( JSON.stringify({ subject: 'activity', method: 'PUT', status : 'ERROR', message : 'please login' }));
        },
        modifyUserAccount : function( details ) {
            console.log( JSON.stringify({ subject: 'user', method: 'PUT', status : 'ERROR', message : 'please login' }));
        },
        deleteUserAccount : function() {
            console.log( JSON.stringify({ subject: 'user', method: 'DELETE', status : 'ERROR', message : 'please login' }));
        }
    }
    console.log(JSON.stringify({ subject: 'logout', method: 'GET', status : 'OK', message : 'logged out' }));
})();