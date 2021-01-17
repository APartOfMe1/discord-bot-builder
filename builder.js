const fs = require('fs');
const fse = require('fs-extra');
const system = require('system-commands');
const builders = require("./builders/main.js");
const reqs = require("./builders/requirements.json");
const requirements = [];
var allCmds = [];

if (fs.existsSync("./output")) { //Make sure we don't overwite any existing bots
    return console.log("It appears you already have an output folder! Delete it then run this program again");
};

builders.genConfigFile().then(() => { //Create a config file for the bot
    builders.categorySelection().then(categories => { //Get the chosen categories
        var sortedCmds = [];

        categories.chosen.forEach(category => {
            var filtered = categories.pairs.filter(i => i.category === category); //Get each command for each category

            sortedCmds.push(filtered);
        });

        builders.chooseCmds(sortedCmds).then(cmds => {
            allCmds = cmds.unsorted;

            cmds.chosenCmds.forEach(cat => {
                var category = cat.category;

                if (category === "Music" && !fs.existsSync("./output/handlers/Music")) { //Only copy over music stuff if we have to
                    fse.ensureDirSync("./output/handlers/Music");

                    fs.copyFileSync("./Framework/Base/Music/music.js", "./output/handlers/Music/music.js");

                    pushReq(["discord-ytdl-core", "ytdl-core", "ytpl", "ytsr"]);
                };

                if (category === "Actions" && !fs.existsSync("./output/assets/images/gifs")) { //Only copy over action stuff if we have to
                    fse.ensureDirSync("./output/assets/images/gifs")

                    fse.copySync("./Framework/Assets/images/gifs", "./output/assets/images/gifs");

                    pushReq(["fs"]);
                };

                var cmdArr = cat.list;

                //Fancy loading animation
                const frames = ["|", "/", "-", "\\"];

                var i = 0;

                var loading = setInterval(() => {
                    console.clear();

                    console.log(`Copying files for ${category}... ${frames[i++]}`);

                    if (i > frames.length - 1) {
                        i = 0;
                    };
                }, 50);

                //Create dirs as needed
                if (!fs.existsSync("./output/commands")) {
                    fs.mkdirSync("./output/commands");
                };

                if (!fs.existsSync(`./output/commands/${category}`)) {
                    fs.mkdirSync(`./output/commands/${category}`);
                };

                builders.getCmdFilePaths(cmdArr, category).then(pathArr => { //Get the file paths for the needed commands, then copy them over
                    pathArr.forEach(path => {
                        fs.copyFileSync(path, `./output/commands/${category}/${path.replace(/^.*[\\\/]/, '').split(".js")[0]}.js`);
                    });
                });

                clearInterval(loading); //Stop the animation

                console.clear();
            });

            fs.copyFileSync("./Framework/index.js", "./output/index.js");

            fse.ensureDirSync("./output/handlers/Main");

            fse.copySync("./Framework/Base/Main", "./output/handlers/Main");

            pushReq(["discord.js", "enmap", "chalk", "klaw"]);
        }).then(async () => {
            for await (const cmd of reqs.modules) { //Check the list of commands to see what modules we need ot install
                if (allCmds.includes(cmd.name)) {
                    pushReq(cmd.requirements);
                };
            };

            //Fancy loading animation
            const frames = ["|", "/", "-", "\\"];

            var i = 0;

            var loading = setInterval(() => {
                console.clear();

                console.log(`Copying files and installing required modules... ${frames[i++]}`);

                if (i > frames.length - 1) {
                    i = 0;
                };
            }, 50);

            system(`cd ./output && npm init -yes && npm i ${requirements.join(" ")}`).then(output => {
                const runCode = `@echo off
                echo Starting...
                :main
                node ./index.js
                echo Restarting...
                goto main`;

                fs.writeFileSync("./output/Run-Bot.bat", runCode);

                clearInterval(loading); //Stop the animation

                console.clear();

                console.log(output);

                setTimeout(() => {
                    console.clear();

                    return console.log("Done! Your new bot can be found in the output folder");
                }, 2000);
            }).catch(err => {
                clearInterval(loading);

                console.clear();

                return console.log(err);
            });
        });
    }).catch(err => {
        return console.log(err);
    });
});

function pushReq(items) { //Takes an array
    if (!items.length) {
        return console.log("There was an error pushing some module requirements to the array");
    };

    items.forEach(item => { //Check if each item already is in the array before adding it
        if (!requirements.includes(item)) {
            requirements.push(item);
        };
    });
};