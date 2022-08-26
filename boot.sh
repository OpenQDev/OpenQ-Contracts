#!/bin/bash
. ./colors.sh
chmod u+x asciiart.sh
../asciiart.sh

echo -e ${Cyan}"Starting all OpenQ containers from scratch..."${Color_Off}
docker stop $(docker ps -aq) && docker rm $(docker ps -aq)
echo -e ${Cyan}"Removed stale OpenQ containers. Booting new..."${Color_Off}

docker-compose -f docker-compose.yml up