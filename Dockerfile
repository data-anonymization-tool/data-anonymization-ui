# Stage 1: Build React App
FROM node:16-alpine as build

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --silent

ARG REACT_APP_GITHUB_TOKEN
ENV REACT_APP_GITHUB_TOKEN=$REACT_APP_GITHUB_TOKEN

# Copy rest of the application files and build
COPY . .
RUN npm run build

# Stage 2: Serve app with NGINX
FROM nginx:alpine

# Copy built app from Stage 1
COPY --from=build /app/build /usr/share/nginx/html

# Expose the port NGINX is serving on
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
