//
// phdometer global object
//
;
var phdometer = (function() {
    return phdometer || {
        formatTime : function( seconds ) {
            var time = Number.parseInt( seconds );
            function pad( string, length ) {
                while( string.length < length ) string = "0" + string;
                return string;
            }
            //
            //
            //
            var hours = Math.floor( activityTime / ( 60 * 60 ) );
            var minutes = Math.floor( ( activityTime - ( hours * 60 * 60 ) ) / 60 );
            var seconds = activityTime - ((minutes*60)+(hours*60*60))

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
    }
})();