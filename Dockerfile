FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Check the actual path of your entry file and build accordingly
RUN npm run build

# Set environment variables
ENV NODE_ENV=production

# Check the actual path to your entry point file
# Update the CMD to point to your actual entry file
CMD ["node", "dist/server.js"]