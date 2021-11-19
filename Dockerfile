FROM node:lts-alpine
WORKDIR /app
RUN apk add --no-cache --virtual .gyp python3 make g++ \
	&& apk del .gyp
RUN apk add python3
COPY package.json .
RUN yarn
COPY . .
CMD yarn deploy:docker