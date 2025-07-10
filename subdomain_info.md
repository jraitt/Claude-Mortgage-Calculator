# Mortgage Calculator Subdomain Setup
## ❖ Linux (Server Deployment)

Follow these steps to deploy the application on a Linux server.

**Get the Project Code**
    *   **To clone the repository for the first time:**
```sh
      git clone https://github.com/jraitt/Claude-Mortgage-Calculator.git
```
**To pull the latest updates if the repository already exists:**
```sh
      git pull
```

## ❖ Add Subdomain at Ionos
mortgagecalc.compound-interests.com

## ❖ Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/mortgagecalc.conf
```

```nginx
server {
    listen 80;
    server_name mortgagecalc.compound-interests.com;
    # This block will be filled/managed by Certbot for HTTPS later
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        # Headers for Next.js
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90;
        
        # Next.js specific optimizations
        proxy_cache_bypass $http_upgrade;
        proxy_set_header Accept-Encoding "";
    }
    
    # Handle Next.js static assets
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## ❖ Enable Site and Add SSL

### Enable the site configuration:
```bash
sudo ln -s /etc/nginx/sites-available/mortgagecalc.conf /etc/nginx/sites-enabled/
```

### Test Nginx config and reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Run Certbot to get your SSL certificate:
```bash
sudo certbot --nginx -d mortgagecalc.compound-interests.com
```

## ❖ Build and Start Docker Container
**Navigate to the project directory and execute the final command:**
```sh
        docker compose up -d --build
```
**This will build the image from the latest code and start the container in detached mode. The application will now be live and accessible at `https://mortgagecalc.compound-interests.com`**