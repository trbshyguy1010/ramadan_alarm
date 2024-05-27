const {Client, Collection ,Events, GatewayIntentBits, EmbedBuilder} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token } = require('../config.json');
const Axios = require('axios');
const cron = require('cron');

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    disableEveryone: false
});

// reading the commands from the folder
client.commands = new Collection();

const commandFiles = fs.readdirSync(path.join(__dirname, 'cmd'));

for (const file of commandFiles) {
    const commandUtils = path.join(__dirname, 'cmd', file);
    const commandfiles = fs.readdirSync(commandUtils).filter(file => file.endsWith('.js'));
    console.log(commandfiles)
    for (const commandfile of commandfiles) {
        console.log(commandfile)
        const command = require(path.join(commandUtils, `${commandfile}`));
        if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
    }
}

// checking for typed command existence
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error('Command not found');
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp('There was an error while executing this command!');
        } else {
            await interaction.reply('There was an error while executing this command!');
        }
    }

})

async function checkIftarTime() {
    try {
        const response = await Axios.get('https://api.aladhan.com/v1/timingsByCity', {
        params: {
            city: 'Tunis',
            country: 'Tunisia',
        }
    });
    let data;
        data = await response.data;
        return [data.data.timings.Maghrib, data.data.timings.Fajr];
    } catch (err) {
        console.log("error happened when fetching the data from the api")
        return null;
    }
    
}

// keno code
/*
if (iftar === true) {
    console.log("its iftar time")
}*/

const embed = new EmbedBuilder()
  .setTitle("Its Iftar Time")
  .setDescription("YOU DID WELL BROTHER! ITS TIME TO FUCKING EAT! MASHALLAH")
  .setImage("https://img.freepik.com/premium-photo/anime-girl-eating-noodles-with-chopsticks-table-generative-ai_955925-24417.jpg")
  .setColor("#e0d047")
  .setFooter({
    text: "Good Job",
  })
  .setTimestamp();

const embed2 = new EmbedBuilder()
  .setTitle("Its Shur Time")
  .setDescription("WAKE UP SHEEP! ITS TIME TO FUCKING EAT! BISMILLAH")
  .setImage("https://i.pinimg.com/originals/66/30/91/663091469b41a53a83b0f10615df34c6.jpg")
  .setColor("#e0d047")
  .setFooter({
    text: "You fucking imbecile",
  })
  .setTimestamp();

let dict_template = {
    "city": "",
    "country": "",
    "channel": "general"
};

const readDefaultJSONTemplateFile = () => {
    let defr = fs.readFileSync("../config/global.json");
    return JSON.parse(defr);
}

console.log(readDefaultJSONTemplateFile())

const createJSONServerFile = (guild_name) => {
    console.log("i have been accessed");
    fs.writeFileSync(`./config/${guild_name}.json`, JSON.stringify(dict_template), (err) => {
        if (err) console.error("error happened when creating the file for the server");
    });
}

const readJSONServerFile = (guild_name) => {
    console.log("i have been accessed 2")
    let file;
    try {
        file = fs.readFileSync(`./config/${guild_name}.json`)
        file = JSON.parse(file);
    } catch (err) {
        file = null;
    }
    return file;
}

// when joining a server send a message that they have not set a channel where they will put the reminder messages in
client.on('guildCreate', guild => {
    let json_server = readJSONServerFile(guild.name); // for thee has rejoined the bot in their server
    if (json_server === null) {
        console.log("thing here");
        createJSONServerFile(guild.name);
    }
    json_server = readJSONServerFile(guild.name);
    let channelLookUp = guild.channels.cache.filter(type => type.type === 0).filter(channel => channel.name === json_server["channel"]).keyAt(0).toString();
    console.log(channelLookUp)
    let channel = client.channels.fetch(channelLookUp);
    channel.then(channel => {
        channel.send("hi there! thanks for inviting me! you should definetly set a channels for future reminders!");
    }).catch((err) => {
        console.log(err);
    })


    if (json_server["city"] === "" && json_server["country"] === "") {
        channel.send("You have not set a city for the prayer times yet. Please set a city using /setcity")
    }
})

client.once("ready", async readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    const iftarShur = await checkIftarTime();
    var iftarTime = iftarShur[0];
    var shurTime = iftarShur[1];
    let iftar = iftarTime.split(":")
    let shur = shurTime.split(":")
    shur[0] = (parseInt(shur[0]) - 1).toString() // give everyone a reminder
    console.log(iftar, shur)
    // please stay on hold
    let job = new cron.CronJob(`* ${iftar[1]} ${iftar[0]} * * *`, async () => {
        // for later
    });

    const items = fs.readdirSync('../config').filter(item => item.endsWith('.json'));
        for (item of items) {
            const filtered_item = item.split(".")[0];
            if (item === "global.json") {
                console.log("Detected global.json");
                continue;
            }
            let json_server = readJSONServerFile(filtered_item);
            console.log(json_server["channel"]); // for debugging purposes
            let channelLookUp = client.channels.cache.filter(type => type.type === 0)
                                                    .filter(guild => guild.guild.name === filtered_item)
                                                    .filter(channel => channel.name === json_server["channel"]);
                                                    //.keyAt(0)
            console.log(channelLookUp);
            if (channelLookUp.size === 0) {
                console.log("Invalid server/channel");
                continue;
            } else {
                const channel = await client.channels.fetch(channelLookUp.keyAt(0).toString());
                await channel.send('@everyone'); // hehe we do a lil bit of trolling
                await channel.send({embeds: [embed]})
            }
        }
    
    let job2 = new cron.CronJob(`* ${shur[1]} ${shur[0]} * * *`, async () => {
        // for later
    });

    job.start();
    job2.start();
});

client.login(token);