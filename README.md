# Discord Bot Builder

The easiest way to create a custom discord.js bot!

## Installation

- Download and unzip the [latest release](https://github.com/APartOfMe1/discord-bot-builder/releases/latest)
- Install [node.js](https://nodejs.org/en/download/)
- Open a command prompt in the release folder

```bash
npm install
```

## Usage

- Go to the [Discord Developer Portal](https://discord.com/developers/applications/)
- Create a new application
- Go down to the bot tab, click "Add Bot", then "Yes, do it!"
- This is where you get your token. Be sure not to share it with anyone!
- Open a command prompt in the release folder and type `node builder.js`
- After the bot is created, you can change additional settings in the config folder

To add your bot to your server, go back to the dev portal and find your client ID under the general information tab. Copy the following link and replace "YOUR_ID" with your bot's client ID.
```bash
https://discord.com/oauth2/authorize?client_id=YOUR_ID&permissions=8&scope=bot
```
