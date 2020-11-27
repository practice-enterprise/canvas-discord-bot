# build stage
FROM node:13.12.0-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install -v
COPY . .
RUN npm run tsc
CMD ["node", "build/app.js"]
