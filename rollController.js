var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var MongoDao = require("./mongoDao.js");

var controller = new Discord.Client({
   token: auth.token,
   autorun: true
});
configure();
logger.debug(controller.token + " - " + auth.token);

controller.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(controller.username + ' - (' + controller.id + ')');
});

controller.on('message', function (user, userId, channelId, message, evt) {
  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with `!`
  if (message.substring(0, 1) == '/') {
    var args = message.substring(1).split(' ');
    var cmd = args[0];

    args = args.splice(1);
    logger.debug("ARGS: " + JSON.stringify(args));
    try{
      switch(cmd) {
        // /debug
        case 'debug':
          logger.info("Debug - Enter");
          debug(controller, user, userId, channelId, message);
          break;
        case 'create':
          logger.info("Create - Enter");
          var msg = message.replace("/create ", "");
          logger.info("INSERT:" + msg);
          MongoDao.create(msg, channelId, output);
          break;
        case 'lookat':
          var discordName = args[0];
          MongoDao.discordNameLookup(discordName, channelId, output);
          break;
        case 'rollit':
          var msg = message.replace("/rollit ", "");
          MongoDao.rollSkill(msg.toLowerCase().replace(" ","_"), user, userId, channelId, output);
          break;
        case 'update':
          MongoDao.update(args, user, userId, channelId, output);
          break;
        case 'remove':
          MongoDao.remove(args, user, userId, channelId, output);
          break;
        // Just add any case commands if you want to..
      }
    } catch(ex) {
      output(channelId, "ERROR OCCURRED");
    }
  }
});

/*
---------------------
FUNCTIONS
---------------------
*/
function configure() {
  // Configure logger settings
  logger.remove(logger.transports.Console);
  logger.add(logger.transports.Console, {
      colorize: true
  });
  logger.level = 'debug';
  process.on('uncaughtException', function (err) {
    logger.error('Caught exception: ' + err);
  });
}

function debug(controller, user, userId, channelId, message) {
  logger.debug("HERE");
  output(channelId, 'Debug - ' + 'User: ' + user + ' - userID: ' + userId + ' - channelId: ' + channelId + ' - message: ' + message);
}

function output(channel, msg) {
  controller.sendMessage({
      to: channel,
      message: msg
  });
}