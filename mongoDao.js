var MongoClient = require('mongodb').MongoClient;
var logger = require('winston');
var url = "mongodb://localhost:27017/simple-rpg";
var CHARACTER_TABLE = 'character';
MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Database created!");
  db.close();
});

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  db.createCollection(CHARACTER_TABLE, function(err, res) {
    if (err) throw err;
    console.log("Collection created!");
    db.close();
  });
});

var MongoDao =  {
  create: function(newRecord, channelId, outputFn) {
    //TODO: VERIFY THAT Discord NAME IS UNIQUE!
    MongoClient.connect(url, function(err, db) {
      if(err) throw err;
      var newCharacter = JSON.parse(newRecord);
      db.collection(CHARACTER_TABLE).insertOne(newCharacter, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted");
        outputFn(channelId, "created!");
        db.close();
      });
    });
  },
  discordNameLookup: function(discordName, channelId, outputFn) {
    var retVal = null;
    var query = { 'discord_name': discordName };
    MongoClient.connect(url, function(err, db) {
      if(err) throw err;
      db.collection(CHARACTER_TABLE).find(query).toArray(function(err, result) {
      if(err) throw err;
        console.log(result);
        outputFn(channelId,makePretty(result[0]));
        db.close();
      });
    });
  },
  rollSkill: function(skill, user, userId, channelId, outputFn) {
      var retVal = null;
      var query = { 'discord_name': user };
      MongoClient.connect(url, function(err, db) {
        if(err) throw err;
        db.collection(CHARACTER_TABLE).find(query).toArray(function(err, result) {
          if (err) throw err;
          console.log(result);
          var character = result[0];
          if(character.rolls[skill] != undefined) {
            console.log("FOUND: " + skill);
          } else {
            skill = skill + "?";
          }
          var numericSkillValue = getNumber(character.rolls[skill]);
          outputFn(channelId,'<@'+userId + '>: ' + skill+' - `1d20+' + numericSkillValue + '` = ' + rollD20(numericSkillValue));
          db.close();
        });
      });
    },
    update: function(args, user, userId, channelId, outputFn) {
      var arg0 = [args[1]];
      var arg1 = [args[2]];
      console.log("arg0: " + arg0);
      console.log("arg1: " + arg1);
      MongoClient.connect(url, function(err, db) {
        if(err) throw err;
        db.collection(CHARACTER_TABLE).update({discord_name:user}, {$set: { [arg0]: arg1}}, function(err, doc) {
          if(err) throw err;
          logger.info("Updated: " + JSON.stringify(doc));
          outputFn(channelId, doc);
        });
      });
    }
}
module.exports = MongoDao;

function makePretty(character) {
  if(character == undefined) {
    return "No Character Found";
  }
  retVal = "Name: " + character.character_first_name + " " + character.character_last_name + "\r\n";
  retVal += "Rolls: \r\n"
  for(var key in character.rolls ) {
    if(character.rolls.hasOwnProperty(key)){
      retVal += "\t" + key + ": " + addPlusOrMinus(character.rolls[key]) + "\r\n";
    }
  }
  return retVal;
}
function addPlusOrMinus(value) {
  if(value > 0) {
    return "+" + value;
  } else if (value < 0){
    return "-" + value;
  } else {
    return value;
  }
}

function getNumber(value) {
  if(isNaN(value)) {
    value = 0;
  }
  return value;
}

function rollD20(modifier) {
  var value = Math.floor((Math.random() * 20) + 1)
  return "(" + value + ")+" + modifier + " = " + (value + modifier)
}