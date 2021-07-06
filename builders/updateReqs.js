const klaw = require('klaw');
const fs = require("fs");

// //Fancy loading animation
// const frames = ["|", "/", "-", "\\"];

// var i = 0;

// var loading = setInterval(() => {
//     console.clear();

//     console.log(`Updating requirements... ${frames[i++]}`);

//     if (i > frames.length - 1) {
//         i = 0;
//     };
// }, 50);

const output = {};

output.modules = [];

klaw("./Framework/").on("data", c => {
    if (!c.path.endsWith(".js")) {
        return;
    };

    const name = c.path.split("\\").pop().split(".js")[0];

    const cmdObj = {
        "name": name,
        "requirements": []
    };

    const content = fs.readFileSync(c.path).toString().split("\n");

    for (const line of content) {
        if (RegExp(/(= |=)(require\(['"])(.*?)(?=['"]\))/g).test(line)) {
            const req = line
                .split(/(\("|\(')/g)
                .pop()
                .split(/("\)|'\))/g)[0];

            if (!RegExp(/\.\.\/|\.\//g).test(req)) {
                //What to ignore entirely
                // "discord.js",
                // "enmap",
                // "chalk",
                // "klaw"

                console.log(req)
            }
        };
    };

    // console.log(cmdObj);
})

function finishLoading() {
    clearInterval(loading); //Stop the animation

    console.clear();

    console.log("Done!");

    setTimeout(() => {
        console.clear();

        return require("./builder.js");
    }, 2500);
};