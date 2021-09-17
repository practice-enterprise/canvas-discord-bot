# Discord bot
## Requirements
- [node](https://nodejs.org/en/)
- [yarn](https://yarnpkg.com/getting-started/install)

## Installation

```sh
yarn install
```

Create `.env` file in root with content:

```txt
DISCORD_TOKEN="<Discord bot token>"
API_URL="http://localhost:3000"

# Login to API (JWT signing)
PASSWORDAPIBOT="supersecretpassword"
```

Notes:

1. API_URL may not end in '/'
2. PASSWORDAPIBOT has to be the same value as the API's dotenv, otherwise you will get a 403 forbidden status code when launching the bot.

## Running

```sh
yarn serve
```
