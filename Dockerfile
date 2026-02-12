FROM node:lts

RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /usr/src/app

COPY --chown=node package*.json bin.js ./
COPY src ./src
ENV NODE_ENV=production
RUN npm install
CMD ["node", "bin.js"]
