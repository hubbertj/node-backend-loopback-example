FROM node:alpine

MAINTAINER Christian Mendy <chris.mendy@evus.com>

ENV NODE_ENV=dev
ENV DB_HOST=127.0.0.1 DB_PORT=3306 DB_NAME=operationhope DB_USER=root DB_PASS=root
    
# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# For development
RUN npm install nodemon -g

# Install app dependencies
COPY ./package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY ./server/ /usr/src/app/server/

EXPOSE 3000

CMD [ "npm", "start" ]