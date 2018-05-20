# Privebot
node js chatbot using IBM Watson conversation NLP AI (https://www.ibm.com/watson/services/conversation-3/) 
& cleverbot io (https://cleverbot.io/) as well as some external libraries.

TL;DR
Chatbot that u can talk with in any language or get some mapped answers back.
=====

This is mostly a try-out to see how fast & easy a chatbot could be setup. I created this a while ago but kinda lost interest so I just wanted to get it live.

The basic idea is that the AI will try to map what you ask/talk to the chatbot to a certain intent & fetch some objects from your sentence.
Depending on what has been programmed, the chatbot will reply as it was told to, based on the intent of your sentence, which then can be further divided by the objects of your sentence.

For example.

Where can I buy beer?
The intent here will be 'where'. 
The objects would be 'buy' & 'beer'.

By default, the AI will try to figure out the intent itself, but you can also tweak it by feeding it examples & thus let the AI learn.
If we would give the AI 1000s of sentences containing water & explicitly map that to the intent 'wine'; no matter how hard u try to get something with water, 
the AI will always map it to wine (see what I did there Jesus). 
The intent returned by the AI contains a certain percentage, depicting how confident the AI is at the fact that the mapped intent is correct.

It's possible to add complete dialog flows & variations of answers to intents (for example, see lunch intent later).

In case of privebot, in case the confidence is less than 50%, we will pass the question/message to cleverbot io.
Cleverbot IO is a multilingual conversation AI.
It will map your question/message to an enormous database & form a reply based on the most used replies to whatever it can make of your conversation.
I tried it with a couple of languages & it seems to work for most languages.
It's better at alphabetical languages than at character-based languages.
Cleverbot IO is quite good, but also quite slow.


The objective is that you have a conversation, send a message to privebot & get the required answer.
For example:
"please explain what prive is?"
-> we would hope that privebot can answer this.
The mapped intent for this is "prive".
So when your sentence contains something about prive, privebot should be able to map it to this intent
and explain what prive is.

Currently mapped intents:
prive:
description of what prive is

meetingroom:
how to add a meetingroom to your event

testserver:
list of all testservers

wifi:
list of the current wifi

introduction:
privebot introducting itself

quote:
generate a random quote from the quotes library (http://quotes.rest/qod.json)

search:
google search of the object of ur message

weather {placename}:
use google weather api to give daily listing of weather in placename

roast {firstname of colleague}:
Always wanted to say Fuck Off to a colleague but didn't have the guts to?
privebot will insult the the colleague u add to roast

lunch:
this intent will propose a place to eat in cyberport, depending on your role in the company

chinese name:
generate a random chinese name, the hardest decision for all gwailos


Technical restraints:

This bot has been deployed on Heroku (https://www.heroku.com/home) which has an uptime of 550 hours in a month, so it's possible privebot will be down sometimes.
Cleverbot IO is a free library, which is good, but slow. Expect response times of +- 10s