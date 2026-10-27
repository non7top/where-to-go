FROM node:22-alpine

# World-writable (sticky) so a named volume mounted here is writable by the host uid
RUN mkdir -p /home/app/.npm /home/app/data-cache && chmod 1777 /home/app /home/app/.npm /home/app/data-cache

ENV HOME=/home/app
WORKDIR /app
