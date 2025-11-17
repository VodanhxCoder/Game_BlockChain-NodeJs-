# Server Dockerfile
FROM node:18-alpine

# Install Python and build dependencies for node-gyp
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including devDependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start the server directly with node to avoid depending on nodemon inside the container
# Use Babel register at runtime so existing code requiring it continues to work
CMD ["node", "-r", "@babel/register", "src/server.js"]
