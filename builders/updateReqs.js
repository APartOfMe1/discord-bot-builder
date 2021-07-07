const listRequirements = require("list-requirements");

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

listRequirements("./Framework/Commands", {
    filters: [
        /fs/g,
        /(discord.js)/g
    ],
}).then(output => {
    console.log(output);
});

// const output = {};

// output.modules = [];

// klaw("./Framework/").on("data", c => {
//     if (!c.path.endsWith(".js")) {
//         return;
//     };

//     const fullName = c.path.split("\\").pop();

//     const cmdObj = {
//         "name": fullName.split(".js")[0],
//         "fullName": fullName,
//         "filePath": c.path,
//         "requirements": []
//     };

//     const content = fs.readFileSync(c.path).toString().split("\n");

//     for (const line of content) {
//         if (RegExp(/(= |=)(require\(['"])(.*?)(?=['"]\))/g).test(line)) {
//             const req = line
//                 .split(/(\("|\(')/g)
//                 .pop()
//                 .split(/("\)|'\))/g)[0];

//             if (!RegExp(/\.\.\/|\.\//g).test(req)) {
//                 if (!["discord.js", "enmap", "chalk", "klaw"].includes("req")) {
//                     cmdObj.requirements.push(req);
//                 };
//             };
//         };
//     };

//     if (cmdObj.requirements.length) {
//         output.modules.push(cmdObj);
//     };
// }).on('end', () => {
//     console.log(output)
// });

function finishLoading() {
    clearInterval(loading); //Stop the animation

    console.clear();

    console.log("Done!");

    setTimeout(() => {
        console.clear();

        return require("./builder.js");
    }, 2500);
};