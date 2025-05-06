FROM node:23-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache bash

COPY wait-for-it.sh ./wait-for-it.sh

RUN chmod +x ./wait-for-it.sh

RUN npm ci

COPY . .

EXPOSE 5000

CMD ["npm", "start"]