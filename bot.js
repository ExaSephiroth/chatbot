'use strict';
const ConversationV1 = require('watson-developer-cloud/conversation/v1');
// new instance of Conversation
const conversation = new ConversationV1({
  username: process.env.WATSONLOGIN,
  password: process.env.WATSONPWD,
  version_date: ConversationV1.VERSION_DATE_2017_02_03
});
/**
 * Call to Conversation API: send message
 * 
 * @param {string} text 
 * @param {object} context 
 * @returns {promise}
 */
function sendMessage(text, context) {
  const payload = {
    workspace_id: process.env.WATSONWORKSPACE,
    input: {
      text: text
    },
    context: context
  };
  return new Promise((resolve, reject) => conversation.message(payload, function(err, data) {
    if (err) {
      reject(err);
    } else {
      resolve(data);
    }
  }));
};

const botkit = require('botkit');

var cleverbot = require("cleverbot.io"),
    cleverbot = new cleverbot(process.env.CLEVERBOTID, process.env.CLEVERBOTTOKEN);
cleverbot.setNick("Prive");
cleverbot.create(function(err, session) {
    if (err) {
        console.log('cleverbot create fail.');
    } else {
        console.log('cleverbot create success.');
    }
});

const request = require('axios');
const randomName = require("chinese-random-skill");

const _ = require('lodash');
const badwordsArray = require('badwords/array');

var controller = botkit.slackbot({
    debug: false
});

var fullTeamList = [];
var fullChannelList = [];

function start_rtm() {
    controller.spawn({
        token: process.env.SLACKTOKEN,
        retry: 1000000000000
    }).startRTM(function(err, bot) {
        if (err) {
            console.log(err);
            return setTimeout(start_rtm, 60000);
        }

        // @ https://api.slack.com/methods/users.list
        bot.api.users.list({}, function(err, response) {
            if (response.ok) {
                var total = response.members.length;

                for (var i = 0; i < total; i++) {
                    var member = response.members[i];
                    fullTeamList.push({
                        name: member.real_name,
                        id: member.id
                    });
                }
            }
        });

        // @ https://api.slack.com/methods/channels.list
        bot.api.channels.list({}, function(err, response) {
            if (response.ok) {
                var total = response.channels.length;
                for (var i = 0; i < total; i++) {
                    var channel = response.channels[i];
                    fullChannelList.push({
                        name: channel.name,
                        id: channel.id
                    });
                }
            }
        });

    });
}

controller.on('rtm_close', function(bot, err) {
    start_rtm();
});


controller.on('rtm_reconnect_failed', function(bot) {
    start_rtm();
});

start_rtm();

var context;

controller.hears('', ['direct_message', 'direct_mention', 'mention'], function(bot, message) {

    var now = Date.now();
    sendMessage(String(message.text), context) // at first message the context is still undefined
        .then(response => {
            context = response.context;
            console.log(response);

            if (response === 'undefined' || _.isEmpty(response.intents)) {
                console.log("time elapsed:", Date.now() - now);
                cleverbotReply(bot, message);
				return;
            }

            var intent = response.intents[0].intent;
			var confidence = response.intents[0].confidence;
			
			if (confidence < 0.5) {
				cleverbotReply(bot, message);
				return;
			}
			
			
            switch (intent) {
                case 'search':
					let question = message.text.substring(message.text.indexOf(' ') + 1);
                    question = encodeURI(question);
                    let go_url = `https://api.duckduckgo.com/?q=!google+${question}&format=json&pretty=1`;

                    bot.replyWithTyping(message, response.output.text.join('\n'));
                    bot.replyWithTyping(message, `<${go_url}|Answers from Google>`);
                    break;
                case 'quote':
                    request.get('http://quotes.rest/qod.json').then(function(res, err) {
                        if (err) {
                            bot.reply(message, err)
                        }
                        let watson_res = response.output.text.join('\n');
                        let quote = res.body.contents.quotes[0].quote;
                        let author = res.body.contents.quotes[0].author;
                        bot.replyWithTyping(message, `${watson_res} \n ${quote} -${author}`)
                    }).catch(function() {
                        controller.log('error', 'There has been an error with the request.');
                        bot.replyWithTyping(message, 'Sorry, I cannot fetch any quote for you right now... :(')
                    })
                    break;
                case 'chinesename':
                    bot.replyWithTyping(message, randomName.generate());
                    break;
                case 'weather':
                    var address = message.text.substring(message.text.indexOf(' ') + 1);
                    var encodedAddress = encodeURIComponent(address);
                    var geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyBtY2rfq_-N4WVasENxoHrDwxrP8ir8FRA&address=${encodedAddress}`;

                    request.get(geocodeUrl).then((response) => {
                        if (response.data.status === 'ZERO_RESULTS') {
                            throw new Error('Unable to find that address.');
                        }

                        var lat = response.data.results[0].geometry.location.lat;
                        var lng = response.data.results[0].geometry.location.lng;
                        var weatherUrl = `https://api.forecast.io/forecast/4a04d1c42fd9d32c97a2c291a32d5e2d/${lat},${lng}`;
                        return request.get(weatherUrl);
                    }).then((response) => {
                        bot.reply(message, response.data.daily.summary);
                    }).catch((e) => {
                        if (e.code === 'ENOTFOUND') {
                            console.log('Unable to connect to API servers.');
                        } else {
                            console.log(e.message);
                        }
                        bot.replyWithTyping(message, 'Sorry, I don\'t understand');
                    });
                    break;
                case 'roast':
                    let target = message.text.substring(message.text.indexOf(' ') + 1).toLowerCase();
                    for (let index = 0; index < fullTeamList.length; index++) {
                        if (fullTeamList[index].name.toLowerCase() == target) {
                            bot.startPrivateConversation({
                                user: fullTeamList[index].id
                            }, function(err, convo) {
                                if (!err && convo) {
                                    convo.say('Someone has a message for you, ' + getBadWord());
                                }
                            });
                            bot.startPrivateConversation({
                                user: message.user
                            }, function(err, convo) {
                                if (!err && convo) {
                                    convo.say('Hello there! I just delivered your message to ' + target);
                                }
                            });
                        }
                    }
                    break;
                default:
                    if (!_.isEmpty(response.output.text)) {
                        bot.replyWithTyping(message, response.output.text.join('\n'));
                    } else {
                        cleverbotReply(bot, message);
                    }
                    break;
            }

        })
        .catch(err => {
            console.log(err);
            bot.replyWithTyping(message, 'Sorry, I don\'t understand');
        });

    tourettes(bot, message);
});

function cleverbotReply(bot, message) {
    console.log("asking cleverbot");
    var now = Date.now();

    try {
        cleverbot.ask(message.text, function(err, response) {
            if (!err) {

                if (response === 'undefined') {
                    console.log("time elapsed:", Date.now() - now);
                    bot.reply(message, 'Sorry, I don\'t understand');
                } else {
                    console.log("time elapsed:", Date.now() - now);
                    bot.reply(message, response);
                }
            } else {
                bot.reply(message, 'Sorry, I don\'t understand');
                console.log('cleverbot err: ' + err);
            }
        });
    } catch (e) {
        bot.reply(message, 'Sorry, I don\'t understand');
        console.log('cleverbot err: ' + err);
    }
};

function tourettes(bot, message) {
    if (Math.random() > 0.75) {
        const LanguageDetect = require('languagedetect');
        var lngDetector = new LanguageDetect();
        var language = lngDetector.detect(message.text)[0];
        if (language === 'undefined' || _.isEmpty(language)) {
            const isChinese = require('is-chinese');
            if (isChinese(message.text)) {
                bot.reply(message, '屌你老母');
            } else {
                bot.reply(message, getBadWord);
            }
        } else {
            let badword;
            switch (language[0]) {
                case 'french':
                    badword = 'fdp ntm';
                    break;
                case 'dutch':
                    badword = 'hoerenzoon';
                    break;
                default:
                    badword = getBadWord();
                    break;
            }
            bot.reply(message, badword);
        }

    }
}

function getBadWord() {
    return badwordsArray[Math.floor(Math.random() * badwordsArray.length)];
}

// possibilities
/*

bot.say({
    text: "Hello world",
    channel: 'C9FJWCDL5'
});

bot.reply(message, 'Hello <@' + message.user + '>');

bot.startPrivateConversation({
    user: message.user
}, function(err, convo) {
    if (!err && convo) {
        convo.say('Hello there! I messaged you because you where in the channel #general');
    }
});

controller.hears(['attach'], ['direct_message', 'direct_mention'], function(bot, message) {

    var attachments = [];
    var attachment = {
        title: 'This is an attachment',
        color: '#FFCC99',
        fields: [],
    };

    attachment.fields.push({
        label: 'Field',
        value: 'A longish value',
        short: false,
    });

    attachment.fields.push({
        label: 'Field',
        value: 'Value',
        short: true,
    });

    attachment.fields.push({
        label: 'Field',
        value: 'Value',
        short: true,
    });

    attachments.push(attachment);

    bot.reply(message, {
        text: 'See below...',
        attachments: attachments,
    }, function(err, resp) {
        console.log(err, resp);
    });
});

controller.hears(['dm me'], ['direct_message', 'direct_mention', 'ambient'], function(bot, message) {
    bot.startConversation(message, function(err, convo) {
        convo.say('Heard ya');
    });

    bot.startPrivateConversation(message, function(err, dm) {
        dm.say('Private reply!');
    });

});

*/