var mailer = require( 'nodemailer' );

var mailer_config = {
    host: 'mail.phd2published.com',
    port: 465,
    /*
    port: 26,
    ignoreTLS: true,
    secure: false, // use SSL?
    */
    auth: {
        user: 'support.phdometer@phd2published.com',
        pass: 'Warrior101'
    },
    tls: {
        rejectUnauthorized: false
    }
};

function getTransport() {
    return mailer.createTransport(mailer_config);
}

function Mailer() {
    
}

Mailer.prototype.send = function( address, subject, text, html ) {
    return new Promise( function( resolve, reject ) {
        try {
            var transport = getTransport();
            if ( transport ) {
                console.log( 'got transport' );
                var mail_options = {
                    from: '"PhDometer support" <support.phdometer@phd2published.com>', // sender address
                    to: address,        // list of receivers
                    subject: subject,   // Subject line
                    text: text,         // plaintext body
                    html: html          // html body                    
                };
                transport.sendMail(mail_options, function(error, info){
                    if(error){
                        console.log( 'mailer error : ' + error );
                        reject( error );
                    } else {
                        console.log( 'mailer ok' );
                        resolve( info );
                    }
                });
            } else {
                reject( "unable to create transport" );
            }
        } catch( error ) {
            reject(error);
        }
    });
}
module.exports = new Mailer();

