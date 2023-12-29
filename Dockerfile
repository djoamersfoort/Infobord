FROM node:20

WORKDIR /app
COPY . /app/

RUN npm ci

CMD ["npm", "start"]
