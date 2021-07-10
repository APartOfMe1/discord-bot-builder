const listRequirements = require("list-requirements");

//Fancy loading animation
const frames = ["|", "/", "-", "\\"];

var i = 0;

const loading = setInterval(() => {
    console.clear();

    console.log(`Updating requirements... ${frames[i++]}`);

    if (i > frames.length - 1) {
        i = 0;
    };
}, 50);

listRequirements("./Framework/Commands", {
    outputLocation: "./builders",
    filters: [
        /fs/g,
        /(discord.js)/g
    ],
}).then(output => {
    //Delay clearing the interval by a bit so that if it finishes instantly, people aren't confused by the "done" message
    setTimeout(() => {
        clearInterval(loading); //Stop the animation

        console.clear();

        console.log("Done!");

        setTimeout(() => {
            console.clear();

            return require("./builder.js");
        }, 2500);
    }, 1500);
});