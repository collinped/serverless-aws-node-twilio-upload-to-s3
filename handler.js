"use strict";

const fetch = require("node-fetch");
const AWS = require("aws-sdk"); // eslint-disable-line import/no-extraneous-dependencies
const twilio = require("twilio");

const s3 = new AWS.S3();

module.exports.save = async (event, context, callback) => {
  console.log("Parameters:");
  console.log(event);

  var twilioParams = JSON.parse(JSON.stringify(event)); // Clone event into new var so we can remove Signature param. Can't just copy var since it copies by reference.
  delete twilioParams.Signature; // Held the X-Twilio-Signature header contents.

  if (
    true !==
    twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN,
      event.Signature,
      process.env.URL + context.path + "/",
      twilioParams
    )
  ) {
    console.log("Twilio auth failure.");
    return callback("Twilio auth failure.");
  } else {
    console.log("Twilio auth success.");
  }

  if (event.NumMedia) {
    //Loop through MediaUrl{N}

    fetch(event.MediaUrl)
      .then((response) => {
        if (response.ok) {
          return response;
        }
        return Promise.reject(
          new Error(
            `Failed to fetch ${response.url}: ${response.status} ${response.statusText}`
          )
        );
      })
      .then((response) => response.buffer())
      .then((buffer) =>
        s3
          .putObject({
            Bucket: process.env.BUCKET,
            Key: event.key,
            Body: buffer,
          })
          .promise()
      )
      .then((v) => callback(null, v), callback);
  } else {
    console.log("No images in message.");
  }

  twiml = new twilio.TwimlResponse();
  // twiml.message( 'Uncomment this line to send this as a text message response back to the sender.' );
  return callback(null, twiml.toString()); // Success.
};
