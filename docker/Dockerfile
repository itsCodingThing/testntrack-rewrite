FROM node:22-alpine AS base

WORKDIR /testntrack_backend_backup
COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 8080
ENV PORT 8080
ENV NODE_ENV=development

CMD ["npm", "run", "start:dev"]
