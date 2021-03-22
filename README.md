# Discord bot
## Requirements
- [node](https://nodejs.org/en/)
- [yarn](https://yarnpkg.com/getting-started/install)

## Installation
```
yarn install
```

create `.env` file in root with content
```
DISCORD_TOKEN="<Discord bot token>"
API_URL="http://localhost:3000"

CANVAS_URL="<Canvas domain>"
CANVAS_TOKEN="<Access token with right permissions>"
```
Note: API_URL and CANVAS_URL may not end in '/'

## Running

```
yarn serve
```
