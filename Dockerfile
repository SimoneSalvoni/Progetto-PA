FROM node:lts-stretch-slim
WORKDIR /usr/src/app
#COPY . .
RUN npm install
RUN cd src
CMD ["node", "index.js"]