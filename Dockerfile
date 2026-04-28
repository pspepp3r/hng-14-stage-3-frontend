FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Set working directory to Nginx html directory
WORKDIR /usr/share/nginx/html

# Copy your frontend files (HTML, CSS, JS) into the container
# This assumes your files are in the root or a 'src' folder. 
# If they are in a folder named 'public', change '.' to 'public'
COPY . .

# Copy the Nginx template
COPY nginx.conf.template /etc/nginx/conf.d/default.template

# Default port if not provided by Railway
ENV PORT=8080

# Create a startup script to inject the port and start Nginx
RUN echo "#!/bin/sh\n\
    envsubst '\$PORT' < /etc/nginx/conf.d/default.template > /etc/nginx/conf.d/default.conf\n\
    exec nginx -g 'daemon off;'" > /entrypoint.sh && \
    chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
