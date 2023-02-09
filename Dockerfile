# hardat requires node 16
FROM node:16-alpine
WORKDIR /app
RUN apk update && apk upgrade && \
	apk add --no-cache bash git curl
COPY package.json .
RUN yarn
COPY . .
CMD curl --connect-timeout 5 \
	--retry-connrefused \
	--max-time 10 \
	--retry 5 \
	--retry-delay 0 \
	--retry-max-time 40 \
	'http://ethnode:8545' \
	&& yarn deploy-contracts:docker \
	&& yarn configure-whitelist:docker \
	&& yarn deploy-bounties-fuzz:docker