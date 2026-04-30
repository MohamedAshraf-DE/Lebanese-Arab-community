# Deployment

GitHub Pages can host the frontend only. The admin login and database need the
Node/Express backend to run on a separate service such as Render.

## Deploy the backend on Render

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint**.
3. Select this repository.
4. Render will read `render.yaml` and create a web service named `jalituna-api`.
5. Set the required secret environment variable:
   - `ADMIN_PASSWORD`: choose the real admin password.
6. Deploy the service.
7. Open:
   - `https://YOUR-RENDER-SERVICE.onrender.com/api/health`
8. It must return JSON like:

```json
{"status":"ok"}
```

The SQLite database is stored at `/var/data/jalituna.db` on a Render persistent
disk, so admin changes and newsletter subscribers survive redeploys.

## Connect GitHub Pages to the backend

Open the admin login page on GitHub Pages, expand **Server settings**, and paste
the Render backend URL, for example:

```text
https://jalituna-api.onrender.com
```

Then click save and log in with:

```text
username: admin
password: the ADMIN_PASSWORD you set on Render
```

You can also prefill the backend URL with:

```text
login.html?api=https://jalituna-api.onrender.com
```

## Local development

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000/login.html
```
