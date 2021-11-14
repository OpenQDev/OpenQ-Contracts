FROM node:lts-alpine
WORKDIR /app
RUN apk update && apk upgrade && \
	apk add --no-cache bash git
RUN apk add python3
COPY package.json .
RUN yarn
COPY . .
CMD yarn deploy:docker