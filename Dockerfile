# Use official Node.js LTS image
FROM node:22.16.18

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the app code
COPY . .

# Expose the app port
EXPOSE 5000

# Run the app
CMD ["npm", "start"]
