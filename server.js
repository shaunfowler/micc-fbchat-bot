var http = require('http');
var Bot = require('messenger-bot');
var request = require('request');

var settings = {
    botToken: 'EAAOQrE66WSEBALR9IOtsDk9XCyj2rCk7nrDIMZCBuqiGBQQTOHhZB1NSdQd0gOy7K3cNCkZBWsmA5QDbTZADKmQBmGxuFg5S2GtJMSXds6v3lDLvAr52DDGsVZAQ5N5JLHFJWUFUZBFeBttOmr0puJlEGAMnSuqwuVBiHiYarIbLHUaDbYdQjm',
    botVerify: 'secretverificationtoken',
    pageId: 'WickedTix-1703396403208122', // from the URL
    openMediaQueueGuid: '809b7e0d-2bec-4be2-9ad0-676771dd389b',
    miccHostName: 'innovate.micccloud.com'
}

var bot = new Bot({ token: settings.botToken, verify: settings.botVerify });

// Handle errors
bot.on('error', (err) => {
    console.log(err.message)
})

// Handle messages
bot.on('message', (payload, reply) => {

    var text = payload.message.text;

    // Not the initial message... don't queue up open media request
    if (text !== 'Hello') {
        return;
    }

    var extractedMid = getExtractedMessageId(payload.message.mid)
    console.log('Incoming message with ID: ', extractedMid, 'and text:', text);

    bot.getProfile(payload.sender.id, (err, profile) => {

        if (err) {
            console.error(err);
            return;
        }

        reply({ text: 'Thanks for contacting WickedTix on Facebook Messenger! Sit tight and we will be right with you :)' }, (err) => {

            if (err) {
                console.error(err);
                return;
            }

            var chatUrl = 'http://www.facebook.com/' + settings.pageId + '/messages/?' + extractedMid;

            // Grab a token and make the open media request
            request.post('http://innovate.micccloud.com/authorizationserver/token', {
                form: {
                    grant_type: 'password',
                    username: '_admin',
                    password: '_password'
                }
            }, function(error, response, body) {
                var token = JSON.parse(body).access_token;
                request.post({
                    url: 'http://innovate.micccloud.com/MiCCSdk/api/v1/openmedia',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    },
                    json: {
                        "targetUri": chatUrl,
                        "targetUriEmbedded": "true",
                        "previewUrl": chatUrl,
                        "from": profile.first_name + ' ' + profile.last_name,
                        "to": "WickedTix",
                        "subject": "WicketTix Chat",
                        "queue": settings.openMediaQueueGuid
                    }
                });
            });
        })
    })
})

function getExtractedMessageId(mid) {
    var n = mid.indexOf(':');
    var leftPart = mid.substring(0, n !== -1 ? n : mid.length);

    n = leftPart.indexOf('.');
    return leftPart.substring(n !== -1 ? n + 1 : 0, leftPart.length);
}

http.createServer(bot.middleware()).listen(3000)