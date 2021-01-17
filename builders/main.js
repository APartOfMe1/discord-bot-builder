const rl = require('readline-sync');
const fs = require('fs');
const fse = require('fs-extra');
const klaw = require('klaw');
const path = require('path');

module.exports = {
    genConfigFile() {
        return new Promise((resolve, reject) => {
            var name = this.requiredQuestion("Bot name: ");

            var token = this.requiredQuestion("Bot token: ");

            var owner = rl.question('What is your user id/the id of the bot owner? (Leave blank for the default ""): ');

            var prefix = rl.question('What would you like the bot prefix to be? (Leave blank for the default "!"): ');

            if (!prefix) {
                var prefix = "!";
            };

            const final = `{
        "name": "${name}",
        "token": "${token}",
        "owners": "${owner}",
        "prefix": "${prefix}",
        "errorChannel": "null",
        "embedColor": "RANDOM",
        "status": [
            "[guild count]",
            "[member count]"
        ]
}`;

            console.log("Creating config file...");

            fs.mkdirSync("./output"); //Create the output directory

            fs.mkdirSync("./output/config");

            fs.writeFileSync("./output/config/config.json", final); //Write the formatted code to the file

            console.log("Done!");

            console.clear();

            return resolve();
        });
    },

    requiredQuestion(question) {
        var answer = rl.question(question);

        while (!answer) { //Repeat until the user provides an answer
            console.log("Invalid response");

            var answer = rl.question(question);
        };

        return answer;
    },

    categorySelection() {
        return new Promise((resolve, reject) => {
            const cmdList = [];

            const catList = [];

            const pairs = [];

            const catChoices = [];

            klaw("./Framework/Commands") //Run through the commands folder
                .on('data', c => {
                    if (!c.path.endsWith(".js")) { //Ignore non-js files
                        return;
                    };

                    const category = path.dirname(c.path).split(path.sep).pop(); //Get the command category

                    const name = c.path.replace(/^.*[\\\/]/, '').split(".js")[0];

                    if (!catList.includes(category)) { //Add the category to the array if it doesn't exist already
                        catList.push(category);
                    };

                    pairs.push({
                        name: name,
                        category: category
                    });

                    cmdList.push(name); //Add the command name to the array
                })
                .on('end', () => {
                    var catIndex = rl.keyInSelect(catList, "What categories would you like to include? (You can choose which commands you would like to import later): ", {
                        guide: false,
                        cancel: "Done"
                    });

                    if (!catChoices.includes(catIndex)) { //Make sure the user hasn't already selected this item
                        catChoices.push(catIndex);
                    };

                    while (!catChoices.includes(-1)) { //Repeat until the user says to cancel
                        console.clear();

                        var chosen = [];

                        catChoices.forEach(c => { //Get the items that have already been chosen
                            chosen.push(`Added ${catList[c]}`);
                        });

                        var catIndex = rl.keyInSelect(catList, `What categories would you like to include? (You can choose which commands you would like to import later): \n\n${chosen.join("\n")}`, {
                            guide: false,
                            cancel: "Done"
                        });

                        if (!catChoices.includes(catIndex)) { //Make sure the user hasn't already selected this item
                            catChoices.push(catIndex);
                        };
                    };

                    console.clear();

                    catChoices.splice(-1, 1); //Remove the useless item

                    if (catChoices.length) {
                        var chosen = [];

                        catChoices.forEach(c => { //Format the message we're about to send
                            chosen.push(`${catList[c]}`);
                        });

                        console.log(`Added ${chosen.join(", ")}`);
                    } else {
                        return reject("You didn't add anything...");
                    };

                    return resolve({
                        pairs: pairs,
                        chosen: chosen
                    });
                });
        });
    },

    chooseCmds(arr) {
        return new Promise((resolve, reject) => {
            const chosenCmds = [];

            const unsortedCmds = [];

            arr.forEach(category => {
                var cmdArr = [];

                console.clear();

                var cmdIndex = rl.keyInSelect(category.map(i => i.name), `Which commands in the category "${category[0].category}" would you like to import?`, {
                    guide: false,
                    cancel: "Done"
                });

                if (!cmdArr.includes(cmdIndex)) { //Make sure the user hasn't already selected this item
                    cmdArr.push(cmdIndex);
                };

                while (!cmdArr.includes(-1)) { //Repeat until the user says to cancel
                    console.clear();

                    var chosen = [];

                    cmdArr.forEach(c => { //Get the items that have already been chosen
                        chosen.push(`Added ${category[c].name}`);
                    });

                    var cmdIndex = rl.keyInSelect(category.map(i => i.name), `Which commands in the category "${category[0].category}" would you like to import?\n\n${chosen.join("\n")}`, {
                        guide: false,
                        cancel: "Done"
                    });

                    if (!cmdArr.includes(cmdIndex)) { //Make sure the user hasn't already selected this item
                        cmdArr.push(cmdIndex);
                    };
                };

                cmdArr.splice(-1, 1); //Remove the useless item

                const finalList = [];

                cmdArr.forEach(i => {
                    unsortedCmds.push(category[i].name);

                    finalList.push(category[i].name);
                });

                chosenCmds.push({
                    category: category[0].category,
                    list: finalList
                });
            });

            return resolve({
                chosenCmds: chosenCmds,
                unsorted: unsortedCmds
            });
        });
    },

    getCmdFilePaths(arr, cat) {
        return new Promise((resolve, reject) => {
            var pathArr = [];

            klaw("./Framework/Commands")
                .on('data', c => {
                    if (!c.path.endsWith(".js")) { //Ignore non-js files
                        return;
                    };

                    const category = path.dirname(c.path).split(path.sep).pop(); //Get the command category

                    const name = c.path.replace(/^.*[\\\/]/, '').split(".js")[0];

                    switch (name) {
                        case "rip":
                            if (!fs.existsSync("./output/assets/images/rip")) {
                                fse.ensureDirSync("./output/assets/images/rip");

                                fs.copyFileSync("./Framework/Assets/images/rip/rip.png", "./output/assets/images/rip/rip.png");
                            };

                            break;

                        case "uno":
                            if (!fs.existsSync("./output/assets/cards/uno")) {
                                fse.ensureDirSync("./output/assets/cards/uno");

                                fs.copyFileSync("./Framework/Assets/cards/uno/cards.json", "./output/assets/cards/uno/cards.json");
                            };

                            break;
                    };

                    if (arr.includes(name) && category === cat) {
                        pathArr.push(c.path);
                    };
                })
                .on('end', () => {
                    return resolve(pathArr);
                });
        });
    }
};