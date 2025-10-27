# Use the official PHP-Apache image
FROM php:8.2-apache

# Copy all project files into the web directory
COPY . /var/www/html/

# Enable Apache mod_rewrite (for routes and .htaccess)
RUN a2enmod rewrite
