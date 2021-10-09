FROM node:alpine
WORKDIR /app
RUN apk update && apk upgrade && \
    apk add --no-cache bash git
COPY package.json .
RUN yarn
COPY . .
CMD yarn deploy:docker