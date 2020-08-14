FROM node:12.17

MAINTAINER Vraid Systems LLC <llc@vraidsys.com>

# app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci --only=production

# Bundle app contents
COPY public public/
COPY src src/

# By default this listens on TCP 3049
EXPOSE 3049
# Default execution of this container
CMD node src/index.js
