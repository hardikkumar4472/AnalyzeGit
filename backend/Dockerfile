FROM node:20-alpine

WORKDIR /app

# Copy package configuration
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy application source code
COPY . .

# Expose backend monolith port
EXPOSE 5000

# Start backend server
CMD ["node", "server.js"]
