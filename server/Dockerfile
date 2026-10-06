FROM node:24-alpine
RUN apk add --no-cache openssl   # nodig voor Prisma op Alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "dev"]
