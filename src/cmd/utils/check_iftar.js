const { SlashCommandBuilder } = require('discord.js');
const Axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check_iftar')
        .setDescription('Check if it is time for iftar!'),
    async execute(interaction) {
        // This is where you would put the code to check if it is time for iftar
        // fetch the prayer times from an api using axios
        // compare the current time with the iftar time
        // if it is iftar time, send a message to the user
        await interaction.deferReply();
        Axios.get('https://api.aladhan.com/v1/timingsByCity', {
            params: {
                city: 'Tunis',
                country: 'Tunisia',
            }
        }).then(response => {
            const iftar = response.data.data.timings.Maghrib.split(":");
            const shur = response.data.data.timings.Fajr.split(":");

            const currentTime = new Date();

            const iftarTime = new Date()
            iftarTime.setHours(parseInt(iftar[0]))
            iftarTime.setMinutes(parseInt(iftar[1]))
                    
            const shurTime = new Date()
            shurTime.setHours(parseInt(shur[0]))
            shurTime.setMinutes(parseInt(shur[1]))
            //shurTime.setDate(new Date().getDate())

            //console.log(iftarTime, shurTime, currentTime);
            //console.log(currentTime > iftarTime, currentTime < shurTime)
            if (currentTime === iftarTime) {
                interaction.followUp(`Its iftar time!`);
            } else if (currentTime > iftarTime || currentTime < shurTime) {
                interaction.followUp(`Its past iftar time! Iftar time is at ${iftarTime.toLocaleTimeString([], {timeStyle: 'short'})} (Tunis) and the current time is ${currentTime.toLocaleTimeString()}`);
            } else {
                interaction.followUp(`Its not iftar time yet! Iftar time is at ${iftarTime.toLocaleTimeString([], {timeStyle: 'short'})} (Tunis) and the current time is ${currentTime.toLocaleTimeString()}`);
            }
        }).catch(error => {
            console.error(error);
            interaction.followUp('There was an error while checking if it is iftar time!');
        });
    }
};