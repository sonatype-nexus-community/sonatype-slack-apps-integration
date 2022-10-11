const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const axios = require('axios');
const dotenv = require('dotenv')
dotenv.config();
app.use(express.json());

/*  Welcome to the Slack Webhook processor for IQ.
    In this script we process an Nexus IQ message and send it to a Slack app. 

    Make sure to update the Environment Variables below.
*/

/*****************/
// ENVIRONMENT VARIABLES
SLACK_URL = process.env.SLACK_URL  //"https://hooks.slack.com/services/..."
PORT = process.env.PORT            //3000
IQ_URL= process.env.IQ_URL         //"http://localhost:8070/"
/*****************/



/*****************/
// RECEIVER
/*****************/
app.post('/slack', function(req, res){
    var data = req.body;
    // console.log("New Slack Message from IQ!");
    // console.log(data)
    
    // Write to file for testing
    // const fs = require('fs')
    // data = JSON.stringify(data)
    // fs.writeFile('test.json', data, (err) => {
    //     if (err) throw err;
    // });

    res.send({status:200})
    processIqData(data)
});


// Visit url in terminal /test to trigger test meesgae (ex. localhost:3000/test )
app.get('/test', function(req, res){ 
    res.send({status:200, message:"Success!"})
    let payload = {
        "timestamp": "2020-04-22T18:30:04.673+0000",
        "initiator": "admin",
        "id": "d5cc2e91d6454545841da5599d3c7156",
        "applicationEvaluation": {
            "application": {
                "id": "0f256982c80b4e13abef4917b93ac343",
                "publicId": "My-Application-ID",
                "name": "App Name",
                "organizationId": "f25acda2a413ab2c62b44917b93ac232"
            },
            "policyEvaluationId": "d5cc2e91d6454545841da5599d3c7156",
            "stage": "release",
            "ownerId": "0f256982c80b4e13abef4917b93ac343",
            "evaluationDate": "2020-04-22T18:30:04.404+0000",
            "affectedComponentCount": 10,
            "criticalComponentCount": 2,
            "severeComponentCount": 5,
            "moderateComponentCount": 3,
            "outcome": "fail",
            "reportId": "36f37cf776dd408bacd063450ab04f71"
        }
    }
    processIqData(payload)
 });


// Do this for different webhook messages
function processIqData(e) {
    //Check if this is an application scan report
    if(e.applicationEvaluation.application.publicId != undefined){
        formatSlackNotification(e)
    }
}

function formatSlackNotification(e) {
    let scanURL = IQ_URL+"assets/index.html#/applicationReport/"+e.applicationEvaluation.application.publicId+"/"+e.applicationEvaluation.reportId+"/policy"
    console.log(scanURL)

    let slackMsg = {
        "channel": "iq",
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "Nexus IQ Evaluation for "+ e.applicationEvaluation.application.name,
                    // "emoji": true
                }
            }, {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": "*Application Evaluation Report*\n\n"+
                                "\t*- Affected Components:*\t"+e.applicationEvaluation.affectedComponentCount+"\n"+
                                "\t*- Critical Components:*\t"+e.applicationEvaluation.criticalComponentCount+"\n"+
                                "\t*- Severe Components:*\t"+e.applicationEvaluation.severeComponentCount+"\n"+
                                "\t*- Moderate Components:*\t"+e.applicationEvaluation.moderateComponentCount+"\n"+
                                "\n\n*Evaluation Date*: \n\t"+e.applicationEvaluation.evaluationDate+"\n"+
                                "*Stage:* "+e.applicationEvaluation.stage+"\n"+
                                "*Outcome:* "+e.applicationEvaluation.outcome+"\n"
                    },
                ]
            }, {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "View Report"
                        },
                        "style": "primary",
                        "url": scanURL
                    }
                ]
            }
        ]
    }
    sendSlackMessage(slackMsg)
}


/*****************/
// Sender
/*****************/
function sendSlackMessage(e){
    var url = SLACK_URL
    var sendData = JSON.stringify(e);

    var config = {
        method: 'post',
        url: url,
        headers: { 
            'Content-Type': 'application/json'
        },
        data : sendData
    };

    //Send new slack message
    axios(config).then(function (response) {
        console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
        console.log(error);
    });
}

app.listen(PORT || 3000);
console.log("Running on http://localhost:"+PORT+"/")

