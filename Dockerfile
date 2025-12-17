FROM node:18-alpine

WORKDIR /app

# Copy application files
COPY . .

# Install simple HTTP server
RUN npm install -g http-server

# Expose port
EXPOSE 8000

# Start server
CMD ["http-server", ".", "-p", "8000", "-c-1"]
