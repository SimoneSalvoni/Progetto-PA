FROM node:lts-stretch-slim
WORKDIR /usr/src/app
COPY . .
RUN npm install
WORKDIR /usr/src/app/src
#CMD ["node", "index.js"]