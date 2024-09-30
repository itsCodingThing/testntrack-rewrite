FROM node:22-alpine AS base

WORKDIR /manageit
COPY package.json package-lock.json ./
RUN npm install 

COPY ../prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npx prisma migrate dev

EXPOSE 8080

CMD ["npm", "run", "start:dev"]
