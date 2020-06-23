require("dotenv").config();
import request from "request";

//Trechos de código extraído do site do FaceBook Developes
let postWebhook = (req, res) => {
    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        body.entry.forEach(function (entry) {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);


            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }

        });

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
};

//Trechos de código extraído do site do FaceBook Developes
let getWebhook = (req, res) => {
    // Seu token de Verificação.
    let VERIFY_TOKEN = process.env.MY_VERIFY_FB_TOKEN;

    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            res.sendStatus(403);
        }
    }
};

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": { "text": response }
    };

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v7.0/me/messages",
        "qs": { "access_token": process.env.FB_PAGE_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!');
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

function firstEntity(nlp, name) {
    return nlp && nlp.entities && nlp.entities[name] && nlp.entities[name][0];
}

function handleMessage(sender_psid, message) {
    //handle message for react, like press like button
    // id like button: sticker_id 369239263222822

    if (message && message.attachments && message.attachments[0].payload) {
        callSendAPI(sender_psid, "Eu to falando sério. Em breve traremos novidades! Estou ansioso para interagir com você");
        callSendAPIWithTemplate(sender_psid);
        return;
    }

    let entitiesArr = ["sobre", "obrigado", "tchau"];
    let entityChosen = "";
    entitiesArr.forEach((name) => {
        let entity = firstEntity(message.nlp, name);
        if (entity && entity.confidence > 0.8) {
            entityChosen = name;
        }
    });

    if (entityChosen === "") {
        //default
        callSendAPI(sender_psid, `Oi, eu ainda não consegui te entender porque não fui treinado, mas em breve traremos novidades e eu poderei te dar maior suporte.`);
    } else {
        if (entityChosen === "sobre") {
            //send greetings message
            callSendAPI(sender_psid, `Oi. Eu sou o chatbot criado para demonstração!`);
        }
        if (entityChosen === "Obrigado") {
            //send thanks message
            callSendAPI(sender_psid, `Que isso! Eu fico sem jeito`);
        }
        if (entityChosen === "tchau") {
            //send bye message
            callSendAPI(sender_psid, 'tchau');
        }
    }
}

//Essa parte manda o link com foto personalizada
let callSendAPIWithTemplate = (sender_psid) => {
    // document fb message template
    // https://developers.facebook.com/docs/messenger-platform/send-messages/templates
    let body = {
        "recipient": {
            "id": sender_psid
        },
        "message": {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [
                        {
                            "title": "Want to build sth awesome?",
                            "image_url": "https://www.nexmo.com/wp-content/uploads/2018/10/build-bot-messages-api-768x384.png",
                            "subtitle": "Tenha mais informações no portal da Unisanta",
                            "buttons": [
                                {
                                    "type": "web_url",
                                    "url": "unisanta.br",
                                    "title": "Site da Unisanta"
                                }
                            ]
                        }
                    ]
                }
            }
        }
    };

    request({
        "uri": "https://graph.facebook.com/v6.0/me/messages",
        "qs": { "access_token": process.env.FB_PAGE_TOKEN },
        "method": "POST",
        "json": body
    }, (err, res, body) => {
        if (!err) {
            // console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
};

module.exports = {
    postWebhook: postWebhook,
    getWebhook: getWebhook
};