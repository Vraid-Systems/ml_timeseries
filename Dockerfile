FROM node:14.8.0-stretch-slim

MAINTAINER Vraid Systems LLC <llc@vraidsys.com>

# app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN apt-get update && apt-get install -y curl g++ make python && rm -rf /var/lib/apt/lists/* && npm ci --only=production && curl -sfL https://install.goreleaser.com/github.com/tj/node-prune.sh | bash -s -- -b /usr/local/bin && /usr/local/bin/node-prune

# Bundle app contents
COPY src src/

# Default execution of this container
CMD node src/index.js
