# Fully Self-Hosting Convex – Achieving the Full Cloud Feature Set

Yes – it **is possible to run a fully featured Convex backend in a self-hosted environment** (including inside a Coder workspace) with all the same capabilities as Convex Cloud. The open-source Convex backend and CLI are kept up-to-date with the cloud service[docs.convex.dev](https://docs.convex.dev/self-hosting#:~:text=Self%20Hosting)[docs.convex.dev](https://docs.convex.dev/self-hosting#:~:text=You%20can%20learn%20more%20about,0%20License), so features like database queries, mutations, **function deployments**, **file storage**, **scheduling (cron jobs)**, and the Convex dashboard are available. The key is to configure your self-hosted Convex instance correctly. Below is a rundown of how to set up and troubleshoot the system for a “Convex Cloud-like” experience in Coder.

## 1. Running the Convex Backend and Dashboard Containers

The simplest way to run Convex self-hosted is using the official Docker images (or Docker Compose). In your Coder workspace (which supports Docker), you can use the Convex provided **`docker-compose.yml`** as a template[stack.convex.dev](https://stack.convex.dev/self-hosted-develop-and-deploy#:~:text=Option%202%3A%20Using%20Docker%20Compose). This compose file defines two services: the Convex **backend** (which serves both the main API port 3210 and the “site” HTTP endpoint port 3211) and the Convex **dashboard** (on port 6791). It also lists several environment variables that must be set for full functionality. Key environment vars include:

- **`CONVEX_CLOUD_ORIGIN` and `CONVEX_SITE_ORIGIN`:** These should be the externally accessible URLs for your backend’s two ports. In a self-host setup on localhost, they default to `http://127.0.0.1:3210` and `http://127.0.0.1:3211` [raw.githubusercontent.com](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml#:~:text=CONVEX_CLOUD_ORIGIN%3D%24%7BCONVEX_CLOUD_ORIGIN%3A,). **When running on a remote workspace with DNS routing, be sure to override these to use the workspace’s DNS names**. For example, if Coder exposes port 3210 at `https://convex-api.<your-domain>`, set `CONVEX_CLOUD_ORIGIN=https://convex-api.<your-domain>` (and similarly for port 3211). These origins are critical – the Convex backend uses them internally and the dashboard uses them to contact the backend. Misconfiguring them can break features. In fact, a known issue in a third-party template was pointing these to the wrong address and **caused 404 errors on file uploads** until fixed[github.com](https://github.com/coollabsio/coolify/issues/5569#:~:text=The%20current%20Convex%20deployment%20template,suffix%20in%20the%20original%20template)[github.com](https://github.com/coollabsio/coolify/issues/5569#:~:text=Impact%3A). In short, **ensure `CONVEX_CLOUD_ORIGIN`/`CONVEX_SITE_ORIGIN` point to the backend’s correct host (and typically no `"/http"` path if you have separate subdomains)**[github.com](https://github.com/coollabsio/coolify/issues/5569#:~:text=The%20current%20Convex%20deployment%20template,suffix%20in%20the%20original%20template)[github.com](https://github.com/coollabsio/coolify/issues/5569#:~:text=environment%3A%20,...%20other%20variables).

- **Database Connection:** By default the self-hosted Convex uses an embedded SQLite, but you can plug in external databases. Since you have Postgres running in the workspace, set the `DATABASE_URL` (or the specific `POSTGRES_URL`) environment variable to your Postgres connection string[stack.convex.dev](https://stack.convex.dev/self-hosted-develop-and-deploy#:~:text=,tech). This tells Convex to use Postgres for storage. Ensure the database exists (the Convex README suggests a DB named “convex_self_hosted” by default) – otherwise create one before launching[stack.convex.dev](https://stack.convex.dev/self-hosted-develop-and-deploy#:~:text=Just%20make%20sure%20there%E2%80%99s%20a,See%20the%20docs). Once `DATABASE_URL` is set, the Convex container will handle migrations automatically on startup.

- **File Storage (S3) Configuration:** Convex's file storage feature uses S3-compatible blob storage under the hood. In self-hosting, you need to provide your own S3 bucket or else Convex will default to storing files on local disk (under `/convex/data/storage/files`).

  **⚠️ AWS SDK Compatibility Note (August 2025)**: Recent AWS SDK changes require CRC32 checksum support that many S3-compatible services don't provide. **Direct Ceph RGW testing confirmed** this affects Ceph Squid version. **Upstream fix available**: Ceph PR #61878 (https://github.com/ceph/ceph/pull/61878) merged March 31, 2025 with full CRC32/CRC32C/CRC64NVME support. For current environments, consider using **MinIO as a gateway** to your storage backend.

  To configure S3 storage, **set AWS credentials and bucket names in the Convex backend's env**:
  - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (and `AWS_SESSION_TOKEN` if needed) for your storage.

  - `AWS_S3_FORCE_PATH_STYLE=true` if you’re using a Ceph or other S3-compatible service that requires path-style requests.

  - `S3_ENDPOINT_URL` if using a custom S3 endpoint (for example, Ceph RGW or MinIO URL)[raw.githubusercontent.com](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml#:~:text=AWS_SESSION_TOKEN%3D%24%7BAWS_SESSION_TOKEN%3A,f).

  - Bucket name variables: Convex allows separating buckets for different purposes (exports, imports, file storage, search, etc.)[raw.githubusercontent.com](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml#:~:text=S3_STORAGE_EXPORTS_BUCKET%3D%24%7BS3_STORAGE_EXPORTS_BUCKET%3A,f). At minimum you should set `S3_STORAGE_FILES_BUCKET` to the name of the bucket you created for file uploads[raw.githubusercontent.com](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml#:~:text=S3_STORAGE_EXPORTS_BUCKET%3D%24%7BS3_STORAGE_EXPORTS_BUCKET%3A,). If you plan to use Convex’s Vector Search feature, also set `S3_STORAGE_SEARCH_BUCKET`. (If these are left blank, Convex will store files on disk by default[github.com](https://github.com/get-convex/convex-backend/issues/93#:~:text=Issue%20body%20actions)[github.com](https://github.com/get-convex/convex-backend/issues/93#:~:text=Actual%20blob%20files%20are%20not,tables%2C%20system%20tables%20take%20gigabytes), which works but won’t use your Ceph store.)

  In your case, you’ve already provisioned an S3 bucket (via Ceph) and have credentials in the workspace. Make sure the Convex container sees them with the exact variable names above. For example, you might export `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as part of the container’s env, and set `S3_STORAGE_FILES_BUCKET=workspace-<your-bucket-name>` (matching the bucket you created in Terraform). **Double-check that these env vars are indeed passed into the Convex process** – in your Terraform snippet the variables like `S3_ACCESS_KEY` would need to map to `AWS_ACCESS_KEY_ID` inside the container.

- **Other settings:** Typically you can leave things like `INSTANCE_NAME`, `INSTANCE_SECRET`, and `CONVEX_RELEASE_VERSION_DEV` empty (they’ll be generated as needed). It’s also fine to disable usage telemetry by setting `DISABLE_BEACON=1`. The `NEXT_PUBLIC_DEPLOYMENT_URL` for the dashboard container should be set to the **external URL of your backend (3210)** so that the web dashboard knows where to reach the API[raw.githubusercontent.com](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml#:~:text=stop_grace_period%3A%2010s%20stop_signal%3A%20SIGINT%20ports%3A,backend%3A%20condition%3A%20service_healthy%20volumes%3A%20data). For example: `NEXT_PUBLIC_DEPLOYMENT_URL=https://convex-api.<your-domain>`.

In practice, to bring this all up in Coder, you can script the following in your startup (which sounds like what you did in `app-startup.sh`):

- Fetch or include the Convex `docker-compose.yml`.

- Fill in/override the environment variables as needed (for remote access and your Postgres/S3 config).

- Run `docker compose up -d` to launch the `backend` and `dashboard`. (Alternatively, you could run the `convex-backend` container with `docker run` manually, but using the provided compose is easier to get all env correct.)

Once the containers are running, **generate an admin key** by exec-ing into the backend container: for example `docker compose exec backend ./generate_admin_key.sh`[stack.convex.dev](https://stack.convex.dev/self-hosted-develop-and-deploy#:~:text=7). This will print an admin key string (format `convex-self-hosted|...`) which you’ll use in the next step.

## 2. Convex CLI – Deploying Functions to Your Self-Hosted Instance

With Convex up and running, you want the same developer workflow as cloud (i.e. `npx convex push/deploy` to upload functions, running `convex dev`, etc.). This is supported – in fact, the Convex team updated the CLI to recognize self-hosted deployments as of v1.19+[classic.yarnpkg.com](https://classic.yarnpkg.com/en/package/convex#:~:text=,hosted%20deployments). To target your instance, you need to set two environment variables _in your development shell_:

- `CONVEX_SELF_HOSTED_URL` – the base URL of your self-hosted Convex **backend API** (the “cloud origin”). This should match the URL you used for `CONVEX_CLOUD_ORIGIN` above (e.g. `https://convex-api.<your-domain>`). Port 3210 is the one the client SDK and CLI talk to for function execution and deployment.

- `CONVEX_SELF_HOSTED_ADMIN_KEY` – the admin key you generated.

These tell the Convex CLI to send operations to your instance instead of to Convex Cloud[classic.yarnpkg.com](https://classic.yarnpkg.com/en/package/convex#:~:text=,hosted%20deployments). **Make sure not to confuse ports** – use the 3210 URL, _not_ the dashboard’s URL (6791) or the site port. For example:

`export CONVEX_SELF_HOSTED_URL="https://convex-api.<your-domain>"  export CONVEX_SELF_HOSTED_ADMIN_KEY="convex-self-hosted|XXXXXXXXXXX..."`

Now you can run `npx convex deploy` (or `npx convex push`) from your app’s directory. The CLI will connect to your backend and deploy your functions just like it would to the cloud. On Convex v1.26.1, all CLI commands that make sense in self-hosted mode should work (e.g. `convex deploy`, `convex dev`, `convex export`, etc.)[classic.yarnpkg.com](https://classic.yarnpkg.com/en/package/convex#:~:text=,hosted%20deployments). If you run `npx convex dev`, you can even live-reload functions against your self-hosted backend.

**Troubleshooting CLI issues:** If you had it working on 1.24.8 but not 1.26.1, it’s likely a configuration mismatch rather than a removed feature. Double-check that the above env vars are set in the environment where you run the CLI. In newer versions, the CLI _ignores_ `CONVEX_DEPLOY_KEY` when `CONVEX_SELF_HOSTED_URL` is present, and uses the admin key instead[stack.convex.dev](https://stack.convex.dev/self-hosted-develop-and-deploy#:~:text=match%20at%20L258%20otherwise%2C%20but,CONVEX_DEPLOY_KEY). So you no longer log in via `npx convex login` for self-hosted – the admin key is your auth. If the CLI is failing to “push functions,” possible issues could be: using the wrong URL (e.g. pointing to the dashboard or wrong domain), using an expired/incorrect admin key, or the backend not reporting healthy. Also ensure your backend’s **`CONVEX_CLOUD_ORIGIN` is exactly the URL the CLI is hitting** – the backend will reject deployments if the origin doesn’t match. The safest approach is to use the same value for `CONVEX_CLOUD_ORIGIN` (backend env) and `CONVEX_SELF_HOSTED_URL` (CLI env).

## 3. File Uploads and Storage in Self-Hosted Convex

Convex’s file upload workflow (using `storage.generateUploadUrl()` on the backend and then uploading via that URL) works in self-hosted mode, but requires the **site origin** to be configured properly. The “site” is essentially the HTTP endpoint (port 3211) that serves file uploads/downloads and HTTP actions. In Convex Cloud this is on a separate domain (`*.convex.site`). In self-host, by default Convex will assume the site origin is just another port on the same host. If you set `CONVEX_SITE_ORIGIN` to the correct address for port 3211, the backend will use that when generating upload URLs.

For example, if your coder workspace exposes port 3211 at `https://convex-proxy.<your-domain>`, set `CONVEX_SITE_ORIGIN=https://convex-proxy.<your-domain>`. (If you instead choose to route it under a path of the main domain, you’d include the `/http` path as the Fly.io guide shows, but using a separate subdomain is simpler.) When this is correct, calling your Convex API to get an upload URL will return a URL pointing to your own site host, and the file data POST will go there. If this is misconfigured, you might see a “404 Not Found” when uploading files, either via the API or the dashboard file manager[github.com](https://github.com/coollabsio/coolify/issues/5569#:~:text=Impact%3A). The fix is invariably to correct the `CONVEX_SITE_ORIGIN` and `CONVEX_CLOUD_ORIGIN` values[github.com](https://github.com/coollabsio/coolify/issues/5569#:~:text=The%20current%20Convex%20deployment%20template,suffix%20in%20the%20original%20template) so that all internal requests route properly to your backend.

On the backend side, if you provided S3 credentials and bucket, the uploaded file bytes will be stored in that bucket. If you did not configure S3, the file will be saved to the local `storage/files` directory inside the container. (That still works, though you’d lose the file if the container is destroyed. For a persistent dev environment with volume mounts it’s fine, but using S3 in your case is preferable.) One current nuance: **deleting files** in Convex (e.g. via `storage.delete()` in code or via the dashboard) will remove them from Convex’s index, but _the blob may remain in the bucket/disk_. The self-hosted Convex doesn’t yet auto-garbage-collect blobs on delete (they are “soft deleted”)[github.com](https://github.com/get-convex/convex-backend/issues/93#:~:text=logs%20and%20file%20are%20not,you%20have%20to%20handle). In practice, this means your S3 bucket might retain old file objects unless you periodically clean them or use lifecycle rules. This is something to be aware of, but it doesn’t impede functionality (uploads, downloads, etc. all work).

## 4. Other Features – Scheduling, Search, etc.

Because the self-hosted backend **“contains the same fully up-to-date code the cloud service uses”**[docs.convex.dev](https://docs.convex.dev/self-hosting#:~:text=If%20you%27re%20excited%20about%20self,code%20the%20cloud%20service%20uses), you have access to advanced features like scheduled functions (cron jobs) and vector search. Cron jobs in Convex are defined in your code (using the Convex scheduling API) and will be handled by your running backend process – no extra setup needed beyond simply deploying those functions. The scheduler is part of the Convex server; as long as your server is running continuously, it will execute cron tasks as scheduled. Likewise, vector search (embedding storage and similarity queries) is supported – if you configure `S3_STORAGE_SEARCH_BUCKET`, the backend will use that for storing the search index data. Make sure to also **enable the search index in your code** (Convex recently introduced a search index feature that you define in code, and the backend then uses the S3 bucket to store the index behind the scenes). The open-source project is actively evolving, so keep an eye on Convex’s release notes or Discord for any new env vars or setup steps needed for new features.

## 5. Summary of “Cloud Experience” in Coder

To mimic the Convex Cloud in your Coder workspace, ensure you do the following:

- **Launch Convex backend + dashboard** (Docker) with proper env:
  - Use your Coder workspace’s **DNS routes** for `CONVEX_CLOUD_ORIGIN` (3210) and `CONVEX_SITE_ORIGIN` (3211). Both should point to the **backend service’s address** (not the dashboard)[github.com](https://github.com/coollabsio/coolify/issues/5569#:~:text=The%20current%20Convex%20deployment%20template,suffix%20in%20the%20original%20template). (No `localhost` here – use actual URLs so that clients and the dashboard can reach it.)

  - Point Convex to your Postgres with `DATABASE_URL` (if using Postgres).

  - Provide S3 credentials & bucket env for file storage (and set `S3_ENDPOINT_URL` + force path style if using a non-AWS endpoint)[raw.githubusercontent.com](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml#:~:text=RUST_BACKTRACE%3D%24%7BRUST_BACKTRACE%3A,)[raw.githubusercontent.com](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml#:~:text=S3_STORAGE_EXPORTS_BUCKET%3D%24%7BS3_STORAGE_EXPORTS_BUCKET%3A,f).

  - Set `NEXT_PUBLIC_DEPLOYMENT_URL` in the dashboard service to your backend URL so the web UI knows where to connect[raw.githubusercontent.com](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml#:~:text=stop_grace_period%3A%2010s%20stop_signal%3A%20SIGINT%20ports%3A,backend%3A%20condition%3A%20service_healthy%20volumes%3A%20data).

- **Generate and use the Admin Key**: Use the `generate_admin_key.sh` from the Convex container to get a key. Export that in your dev shell along with `CONVEX_SELF_HOSTED_URL` for CLI use.

- **Deploy your functions via CLI**: With the env vars set, run `npx convex deploy`. On success, you’ll see your functions live in the self-hosted dashboard (just like on the cloud dashboard), and your frontend can connect using the `ConvexReactClient("<your URL>")` initialized to your self-hosted URL (you might inject this via an env like `VITE_CONVEX_URL`)[stack.convex.dev](https://stack.convex.dev/self-hosted-develop-and-deploy#:~:text=1%20VITE_CONVEX_URL%3D%22%3Chttps%3A%2F%2Fexample).

- **Test file uploads**: Try using the Convex file API (or the dashboard’s file manager) to upload a file. If configured correctly, the upload will succeed and you can fetch the file back. If you get a 404, it’s almost certainly the `CONVEX_SITE_ORIGIN` mismatch – fix that and it should work[github.com](https://github.com/coollabsio/coolify/issues/5569#:~:text=Impact%3A).

- **Use scheduling and other features**: Define any cron jobs or periodic functions in your Convex code – the self-hosted server will run them. No additional setup is needed for scheduling. Similarly, authentication, middleware, and any other Convex features work as in cloud (you might need to set up any third-party secrets or credentials your functions use, of course).

In summary, **you can absolutely achieve a full Convex cloud-like development environment in Coder**. Many others have successfully self-hosted Convex on platforms like Fly.io, Railway, and Kubernetes with all features enabled. The Convex team’s goal was to make self-hosting “seamless” and as close to the cloud experience as possible[news.convex.dev](https://news.convex.dev/self-hosting/#:~:text=Ease%20of%20use)[news.convex.dev](https://news.convex.dev/self-hosting/#:~:text=We%E2%80%99ve%20packaged%20up%20the%20backend,hosting%20instructions) – with the steps above, you should be able to push code, handle file uploads, and use Convex as if it were the managed service. The issues you hit on v1.26.1 likely come down to configuration details. By aligning the environment variables and using the admin key + URL in the CLI (as introduced in recent versions[classic.yarnpkg.com](https://classic.yarnpkg.com/en/package/convex#:~:text=,hosted%20deployments)), you should find that Convex’s latest version works correctly in self-hosted mode. If you run into any lingering glitches (e.g. a particular bug in 1.26.x), consider checking Convex’s GitHub issues for patches or using the Discord `#self-hosted` channel for up-to-date tips[docs.convex.dev](https://docs.convex.dev/self-hosting#:~:text=To%20get%20started%20with%20self,hosting%20guide). But fundamentally, **all Convex Cloud features _can_ run self-hosted** – you just have to be your own “cloud provider” for the database, storage, and uptime management.

**Sources:**

- Convex Self-Hosting Guide (open-source repo README)[stack.convex.dev](https://stack.convex.dev/self-hosted-develop-and-deploy#:~:text=Option%202%3A%20Using%20Docker%20Compose)[stack.convex.dev](https://stack.convex.dev/self-hosted-develop-and-deploy#:~:text=You%20can%20either%20build%20your,Notable%20ones%20are)

- Official Convex Docker Compose (env variables and configuration)[raw.githubusercontent.com](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml#:~:text=CONVEX_CLOUD_ORIGIN%3D%24%7BCONVEX_CLOUD_ORIGIN%3A,)[raw.githubusercontent.com](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml#:~:text=S3_STORAGE_EXPORTS_BUCKET%3D%24%7BS3_STORAGE_EXPORTS_BUCKET%3A,f)

- Coolify issue highlighting correct `CONVEX_CLOUD_ORIGIN`/`SITE_ORIGIN` usage for file uploads[github.com](https://github.com/coollabsio/coolify/issues/5569#:~:text=The%20current%20Convex%20deployment%20template,suffix%20in%20the%20original%20template)[github.com](https://github.com/coollabsio/coolify/issues/5569#:~:text=Impact%3A)

- Convex CLI Release Notes – self-hosted support via admin key & URL[classic.yarnpkg.com](https://classic.yarnpkg.com/en/package/convex#:~:text=,hosted%20deployments)

Citations

[](https://docs.convex.dev/self-hosting#:~:text=Self%20Hosting)

![](https://www.google.com/s2/favicons?domain=https://docs.convex.dev&sz=32)

Self Hosting | Convex Developer Hub

https://docs.convex.dev/self-hosting

[](https://docs.convex.dev/self-hosting#:~:text=You%20can%20learn%20more%20about,0%20License)

![](https://www.google.com/s2/favicons?domain=https://docs.convex.dev&sz=32)

Self Hosting | Convex Developer Hub

https://docs.convex.dev/self-hosting

[](https://stack.convex.dev/self-hosted-develop-and-deploy#:~:text=Option%202%3A%20Using%20Docker%20Compose)

![](https://www.google.com/s2/favicons?domain=https://stack.convex.dev&sz=32)

Self-Hosting with Convex: Everything You Need to Know

https://stack.convex.dev/self-hosted-develop-and-deploy

[](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml#:~:text=CONVEX_CLOUD_ORIGIN%3D%24%7BCONVEX_CLOUD_ORIGIN%3A,)

![](https://www.google.com/s2/favicons?domain=https://raw.githubusercontent.com&sz=32)

raw.githubusercontent.com

https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml

[](https://github.com/coollabsio/coolify/issues/5569#:~:text=The%20current%20Convex%20deployment%20template,suffix%20in%20the%20original%20template)

![](https://www.google.com/s2/favicons?domain=https://github.com&sz=32)

[Bug]: Incorrect Environment Variables in Convex Deployment Template · Issue #5569 · coollabsio/coolify · GitHub

https://github.com/coollabsio/coolify/issues/5569

[](https://github.com/coollabsio/coolify/issues/5569#:~:text=Impact%3A)

![](https://www.google.com/s2/favicons?domain=https://github.com&sz=32)

[Bug]: Incorrect Environment Variables in Convex Deployment Template · Issue #5569 · coollabsio/coolify · GitHub

https://github.com/coollabsio/coolify/issues/5569

[](https://github.com/coollabsio/coolify/issues/5569#:~:text=environment%3A%20,...%20other%20variables)

![](https://www.google.com/s2/favicons?domain=https://github.com&sz=32)

[Bug]: Incorrect Environment Variables in Convex Deployment Template · Issue #5569 · coollabsio/coolify · GitHub

https://github.com/coollabsio/coolify/issues/5569

[](https://stack.convex.dev/self-hosted-develop-and-deploy#:~:text=,tech)

![](https://www.google.com/s2/favicons?domain=https://stack.convex.dev&sz=32)

Self-Hosting with Convex: Everything You Need to Know

https://stack.convex.dev/self-hosted-develop-and-deploy

[](https://stack.convex.dev/self-hosted-develop-and-deploy#:~:text=Just%20make%20sure%20there%E2%80%99s%20a,See%20the%20docs)

![](https://www.google.com/s2/favicons?domain=https://stack.convex.dev&sz=32)

Self-Hosting with Convex: Everything You Need to Know

https://stack.convex.dev/self-hosted-develop-and-deploy

[](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml#:~:text=AWS_SESSION_TOKEN%3D%24%7BAWS_SESSION_TOKEN%3A,f)

![](https://www.google.com/s2/favicons?domain=https://raw.githubusercontent.com&sz=32)

raw.githubusercontent.com

https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml

[](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml#:~:text=S3_STORAGE_EXPORTS_BUCKET%3D%24%7BS3_STORAGE_EXPORTS_BUCKET%3A,f)

![](https://www.google.com/s2/favicons?domain=https://raw.githubusercontent.com&sz=32)

raw.githubusercontent.com

https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml

[](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml#:~:text=S3_STORAGE_EXPORTS_BUCKET%3D%24%7BS3_STORAGE_EXPORTS_BUCKET%3A,)

![](https://www.google.com/s2/favicons?domain=https://raw.githubusercontent.com&sz=32)

raw.githubusercontent.com

https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml

[](https://github.com/get-convex/convex-backend/issues/93#:~:text=Issue%20body%20actions)

![](https://www.google.com/s2/favicons?domain=https://github.com&sz=32)

logs and file are not being deleted on self-hosted · Issue #93 · get-convex/convex-backend · GitHub

https://github.com/get-convex/convex-backend/issues/93

[](https://github.com/get-convex/convex-backend/issues/93#:~:text=Actual%20blob%20files%20are%20not,tables%2C%20system%20tables%20take%20gigabytes)

![](https://www.google.com/s2/favicons?domain=https://github.com&sz=32)

logs and file are not being deleted on self-hosted · Issue #93 · get-convex/convex-backend · GitHub

https://github.com/get-convex/convex-backend/issues/93

[](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml#:~:text=stop_grace_period%3A%2010s%20stop_signal%3A%20SIGINT%20ports%3A,backend%3A%20condition%3A%20service_healthy%20volumes%3A%20data)

![](https://www.google.com/s2/favicons?domain=https://raw.githubusercontent.com&sz=32)

raw.githubusercontent.com

https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml

[](https://stack.convex.dev/self-hosted-develop-and-deploy#:~:text=7)

![](https://www.google.com/s2/favicons?domain=https://stack.convex.dev&sz=32)

Self-Hosting with Convex: Everything You Need to Know

https://stack.convex.dev/self-hosted-develop-and-deploy

[](https://classic.yarnpkg.com/en/package/convex#:~:text=,hosted%20deployments)

![](https://www.google.com/s2/favicons?domain=https://classic.yarnpkg.com&sz=32)

convex | Yarn

https://classic.yarnpkg.com/en/package/convex

[](https://stack.convex.dev/self-hosted-develop-and-deploy#:~:text=match%20at%20L258%20otherwise%2C%20but,CONVEX_DEPLOY_KEY)

![](https://www.google.com/s2/favicons?domain=https://stack.convex.dev&sz=32)

Self-Hosting with Convex: Everything You Need to Know

https://stack.convex.dev/self-hosted-develop-and-deploy

[](https://github.com/get-convex/convex-backend/issues/93#:~:text=logs%20and%20file%20are%20not,you%20have%20to%20handle)

![](https://www.google.com/s2/favicons?domain=https://github.com&sz=32)

logs and file are not being deleted on self-hosted #93 - GitHub

https://github.com/get-convex/convex-backend/issues/93

[](https://docs.convex.dev/self-hosting#:~:text=If%20you%27re%20excited%20about%20self,code%20the%20cloud%20service%20uses)

![](https://www.google.com/s2/favicons?domain=https://docs.convex.dev&sz=32)

Self Hosting | Convex Developer Hub

https://docs.convex.dev/self-hosting

[](https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml#:~:text=RUST_BACKTRACE%3D%24%7BRUST_BACKTRACE%3A,)

![](https://www.google.com/s2/favicons?domain=https://raw.githubusercontent.com&sz=32)

raw.githubusercontent.com

https://raw.githubusercontent.com/get-convex/convex-backend/main/self-hosted/docker/docker-compose.yml

[](https://stack.convex.dev/self-hosted-develop-and-deploy#:~:text=1%20VITE_CONVEX_URL%3D%22%3Chttps%3A%2F%2Fexample)

![](https://www.google.com/s2/favicons?domain=https://stack.convex.dev&sz=32)

Self-Hosting with Convex: Everything You Need to Know

https://stack.convex.dev/self-hosted-develop-and-deploy

[](https://news.convex.dev/self-hosting/#:~:text=Ease%20of%20use)

![](https://www.google.com/s2/favicons?domain=https://news.convex.dev&sz=32)

Convex Self-Hosting: More than just open source

https://news.convex.dev/self-hosting/

[](https://news.convex.dev/self-hosting/#:~:text=We%E2%80%99ve%20packaged%20up%20the%20backend,hosting%20instructions)

![](https://www.google.com/s2/favicons?domain=https://news.convex.dev&sz=32)

Convex Self-Hosting: More than just open source

https://news.convex.dev/self-hosting/

[](https://docs.convex.dev/self-hosting#:~:text=To%20get%20started%20with%20self,hosting%20guide)

![](https://www.google.com/s2/favicons?domain=https://docs.convex.dev&sz=32)

Self Hosting | Convex Developer Hub

https://docs.convex.dev/self-hosting

[](https://stack.convex.dev/self-hosted-develop-and-deploy#:~:text=You%20can%20either%20build%20your,Notable%20ones%20are)

![](https://www.google.com/s2/favicons?domain=https://stack.convex.dev&sz=32)

Self-Hosting with Convex: Everything You Need to Know

https://stack.convex.dev/self-hosted-develop-and-deploy
