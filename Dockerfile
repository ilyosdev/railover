FROM node:18-alpine

RUN apk add --no-cache git openssh-client

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY built/ ./built/
COPY template/ ./template/
COPY dockerfiles/ ./dockerfiles/
COPY public/ ./public/
COPY currentdirectory ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000 80 443

CMD ["node", "built/server.js"]
