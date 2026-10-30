# CheckCC VPS 部署（Docker + Nginx）

CheckCC 是纯静态站点：构建产物是 `out/`，由 Nginx 容器提供静态文件；没有 Node 服务端运行时，也没有数据库。本文面向在 Linux 云服务器上自建站点，脚本只负责构建、启动和健康检查。

> 域名、HTTPS、反向代理、云安全组和主机防火墙都需要你按实际环境配置。脚本不会自动安装 Docker，也不会修改系统防火墙。
>
> 已经有 Docker 和反向代理？直接看 [3. 一键部署](#3-一键部署)。首次部署建议先读第 1、2 节。

## 1. 先选择部署拓扑

`CHECKCC_PORT=8080` 只是项目默认值，不是必须使用 8080；`CHECKCC_BIND` 也不是固定为 `127.0.0.1`。按实际拓扑选择：

| 场景 | `CHECKCC_BIND` | 外部访问方式 | 建议 |
| --- | --- | --- | --- |
| 已有 Nginx / Caddy / Traefik | `127.0.0.1` | 反向代理到 `127.0.0.1:<CHECKCC_PORT>` | 推荐；只暴露 80/443 |
| 没有反向代理，仅本机验收 | `127.0.0.1` | SSH 隧道 | 推荐用于首次验收，不暴露公网端口 |
| 没有反向代理，临时公网访问 | `0.0.0.0` 或指定网卡 IP | `http://<服务器IP>:<CHECKCC_PORT>` | 仅临时使用；安全组限制来源，正式使用前补 TLS |
| 使用 Cloudflare Pages / Netlify / Vercel 等 | 不使用 Docker | 直接托管 `out/` | 见主 README 的“手动静态托管” |

如果反向代理本身也运行在 Docker 容器里，`127.0.0.1` 指的是代理容器自己，不是宿主机。此时应把两个容器放到同一 Docker 网络，代理使用服务名访问；或者让 CheckCC 绑定宿主机地址，再按 Docker 网络实际可达的地址访问。

## 2. 前置检查

### 2.1 系统与 Docker

本项目在 Ubuntu / Debian 上验证；其他 Linux 发行版只要 Docker 和 Compose 可用，通常也可以部署。

需要：

- Docker Engine 20.10+（建议 24+）
- Docker Compose v2+
- 至少约 2 GB 可用磁盘给镜像和构建缓存；内存不足时按 2.2 加 swap

安装 Docker 请按官方文档操作，不要在生产服务器上直接执行来源不明的安装脚本：

- Ubuntu: <https://docs.docker.com/engine/install/ubuntu/>
- Debian: <https://docs.docker.com/engine/install/debian/>

安装完成后启用服务：

```bash
sudo systemctl enable --now docker
```

如果不想用 root 运行 Docker，把当前用户加入 `docker` 组后重新登录：

```bash
sudo usermod -aG docker "$USER"
```

验证：

```bash
docker --version
docker compose version
docker info >/dev/null && echo "Docker OK"
```

如果 `docker compose` 不存在，安装 Compose 插件（Debian/Ubuntu 的包名通常是 `docker-compose-plugin`），不要依赖旧的 `docker-compose` v1。

### 2.2 低内存主机

Next.js 构建阶段内存占用较高。2 GB 内存及以下的服务器建议先添加 2 GB swap（已有 swap 可跳过；执行前确认 `/etc/fstab` 中还没有 `/swapfile` 记录）：

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

检查内存和磁盘：

```bash
free -h
df -h /
```

构建完成后 swap 可以保留；如果只是临时使用，也可在确认没有其他用途后关闭并删除。磁盘只剩几百 MB 时先扩容或清理，不要直接开始构建。

### 2.3 端口和占用检查

```bash
ss -lntp | grep -E ':(80|443|8080)\b' || true
```

`8080` 只是默认端口。被占用时换一个空闲端口（例如 `18081`），不要直接 kill 不认识的进程。换端口后记得同步修改反向代理配置。

## 3. 一键部署

首次部署：

```bash
git clone https://github.com/Brilliant666/check-cc.git
cd check-cc
cp .env.example .env
# 编辑 .env：至少确认 NEXT_PUBLIC_SITE_URL、CHECKCC_BIND、CHECKCC_PORT
./deploy/deploy.sh
```

> 只有首次部署才执行 `cp`。更新已有站点时不要重复复制 `.env.example`，否则会覆盖现有配置。

脚本会：

1. 检查 Docker 与 Compose 是否可用；
2. 首次运行时从 `.env.example` 创建 `.env`；
3. 执行 `docker compose up -d --build`；
4. 等待容器健康检查通过；
5. 输出访问地址、日志和重启命令。

脚本不会安装 Docker，也不会配置域名、TLS、反向代理或系统防火墙。

反向代理场景的 `.env` 最小示例：

```dotenv
NEXT_PUBLIC_SITE_URL=https://check.example.com
CHECKCC_BIND=127.0.0.1
CHECKCC_PORT=8080
```

`NEXT_PUBLIC_SITE_URL` 是站点对外地址，不是服务器内网地址。没有域名时可以先留空，等域名和 TLS 配好后再填并重新构建。

命令行覆盖示例（`18081` 只是示例，换成任意空闲端口）：

```bash
CHECKCC_BIND=127.0.0.1 CHECKCC_PORT=18081 ./deploy/deploy.sh
```

命令行变量优先于 `.env`。修改 `NEXT_PUBLIC_*` 后必须重新构建；只改 `.env` 里的 `CHECKCC_BIND` / `CHECKCC_PORT` 时，执行 `docker compose up -d` 即可；如果使用命令行覆盖，重新执行 `./deploy/deploy.sh`。

## 4. 配置项

| 变量 | 默认值 | 生效时机 | 说明 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 空 | 构建时 | 站点对外地址，例如 `https://check.example.com`。设置后才生成 canonical、hreflang、OG URL 和 sitemap；为空时这些字段不输出 |
| `NEXT_PUBLIC_REPO_URL` | 本仓库 | 构建时 | 页头、页脚和源码入口使用的 GitHub 地址 |
| `NEXT_PUBLIC_IP_INTEL_ENABLED` | `true` | 构建时 | `false` 时彻底关闭网络层，界面不显示开关，也不发送 IP 查询、STUN、Anthropic 端点探测或 IPv6 查询 |
| `NEXT_PUBLIC_IP_INTEL_ENDPOINT` | `https://ipwho.is/` | 构建时 | 浏览器直连的主 CORS IP 查询接口，必须是 HTTPS |
| `NEXT_PUBLIC_IP_INTEL_FALLBACK_ENDPOINT` | `https://get.geojs.io/v1/ip/geo.json,https://ipapi.co/json/` | 构建时 | 主接口失败、超时或被限流时按顺序尝试，多个用英文逗号分隔；设为空字符串可关闭回退。成功提示会显示实际使用的服务 |
| `NEXT_PUBLIC_WEBRTC_STUN_URL` | `stun:stun.cloudflare.com:3478` | 构建时 | 网络层开启时用于收集 WebRTC 出口候选的 STUN 地址；浏览器会直接连接它 |
| `NEXT_PUBLIC_IPV6_ENDPOINT` | `https://api6.ipify.org?format=json` | 构建时 | IPv6 直连出口查询接口，返回 JSON 中的 `ip` 字段；必须是只解析 AAAA 记录的 HTTPS 地址 |
| `CHECKCC_BIND` | `0.0.0.0` | 启动时 | 宿主机监听地址；按上面的拓扑选择 `127.0.0.1`、`0.0.0.0` 或指定网卡 IP |
| `CHECKCC_PORT` | `8080` | 启动时 | 宿主机端口；可以改成任意空闲端口，容器内部始终监听 8080 |

说明：

- `.env` 从仓库根目录读取；请从仓库根目录执行 `./deploy/deploy.sh`。
- `.env` 不应提交到 Git，也不要打进镜像。
- `NEXT_PUBLIC_*` 会写入静态文件，改完后必须重新构建。
- `NEXT_PUBLIC_SITE_URL` 末尾的 `/` 会被自动去掉；正式站点建议使用 `https://`。
- `NEXT_PUBLIC_IP_INTEL_FALLBACK_ENDPOINT=` 留空表示只使用主接口。
- `.env` 里没有这一行时使用默认的两个备用接口。如果你的 `.env` 是从旧版 `.env.example` 复制的，里面会写死 `https://ipapi.co/json/`，这样只有一个备用接口；删掉这一行或改成新的默认值，再重新构建。
- 构建时生成的 CSP 会自动放行这里列出的所有接口，不需要手动修改 Nginx 配置。
- 新的网络层子探测都受 `NEXT_PUBLIC_IP_INTEL_ENABLED=false` 统一关闭；没有单独开关。
- 端点可达性探测使用 `no-cors` 请求，只能判断网络是否可达与耗时，无法读取响应内容，也不代表账号或地区可用。
- IPv6 查询会访问第三方服务 `api6.ipify.org`；IPv6 出口与 HTTP 出口地址族不同属于正常双栈，不视为泄漏。

## 5. 反向代理、HTTPS 和防火墙

Nginx（宿主机）示例，`proxy_pass` 的端口改成你的 `CHECKCC_PORT`：

```nginx
server {
    listen 80;
    server_name check.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Caddy 示例，Caddy 会自动申请 HTTPS 证书：

```caddyfile
check.example.com {
    # 端口改成 CHECKCC_PORT
    reverse_proxy 127.0.0.1:8080
}
```

只放行 80/443；不要长期放行 8080。云安全组和主机防火墙都要检查。

如果只想在服务器本机验收，可以保持 `127.0.0.1` 绑定并建立 SSH 隧道：

```bash
ssh -N -L <本地端口>:127.0.0.1:<CHECKCC_PORT> <用户>@<服务器>
# 浏览器打开 http://127.0.0.1:<本地端口>
```

本地端口和服务器端口可以不同；本地端口被占用就换一个。如果 `CHECKCC_BIND` 绑定的是特定网卡 IP，隧道目标写那个 IP。

## 6. 验证

在服务器上执行，`PORT` 改成 `.env` 里的 `CHECKCC_PORT`：

```bash
PORT="$(sed -n 's/^CHECKCC_PORT=//p' .env | tail -n 1)"
PORT="${PORT:-8080}"
BASE="http://127.0.0.1:${PORT}"   # 绑定特定网卡 IP 时改成该 IP

curl -fsS "$BASE/healthz"
for path in / /en/ /hong-kong/ /russia/ /no-such-page/; do
  curl -s -o /dev/null -w "$path %{http_code}\n" "$BASE$path"
done
curl -sI "$BASE/" | sed -n '1,20p'
curl -sI "$BASE/en" | grep -i '^location'
docker compose ps
docker exec checkcc id -u
```

预期：

- `/healthz` 返回 `ok`；
- `/`、`/en/`、`/hong-kong/`、`/russia/` 返回 200，未知路径返回 404；
- HTML 返回 `Cache-Control: no-cache`，`/_next/static/` 资源长期缓存，并启用 gzip；
- 响应头里有 `Content-Security-Policy`，其中 `connect-src` 列出的是你配置的 IP 查询和 IPv6 查询地址；
- `/en` 的 301 跳转 `Location` 是相对路径 `/en/`，不带容器内部端口；
- `docker compose ps` 显示 `healthy`，`docker exec checkcc id -u` 输出 `101`（非 root）；
- 重启后恢复健康：

```bash
docker restart checkcc
docker inspect -f '{{.State.Health.Status}}' checkcc
```

浏览器验收时注意：

- 网络层默认关闭；首次检测只使用浏览器信号，不发送 IP 查询。
- 点击“开启网络层并重测”后，浏览器会先请求 `ipwho.is`；失败或被限流时依次尝试 `get.geojs.io` 和 `ipapi.co`，成功提示会显示实际使用的服务。被限流的接口在本次浏览会话内会暂时跳过 1 小时。
- 同一次网络层检测还会直连 STUN、IPv6 查询接口和 Anthropic 三个探测目标（claude.ai 边缘诊断路径、www.anthropic.com、api.anthropic.com）；它们相互独立，单个探测失败只影响对应信号。claude.ai 主站受 CORP 限制，浏览器不直接探测。
- 两个 IP 接口都失败时才会跳过 IP 信号；覆盖率下降，但风险分不会被抬高。
- 打开浏览器开发者工具的控制台，开启网络层检测后不应出现 `Content Security Policy` 报错；如果出现，通常是自定义了 `NEXT_PUBLIC_*` 端点但没有重新构建。
- IP 查询、STUN、IPv6 查询和端点探测都由访客浏览器直接发起，Nginx 访问日志里看不到这些第三方请求，这是正常的。

## 7. 更新、回滚和清理

更新版本：

```bash
git pull
./deploy/deploy.sh
```

`.env` 会保留；项目没有数据库和持久化卷，更新只会替换静态文件和容器，通常只有很短的停机时间。更新前可以用 `git log -1` 确认版本。

> **从 `9a079d7` 之前的版本升级**：容器内端口从 80 改为 8080。用本仓库的 `docker-compose.yml` 和 `deploy.sh` 部署时，映射已同步修改，宿主机端口仍由 `CHECKCC_PORT` 决定，不需要额外操作。如果你的反向代理直接连接容器的 80 端口（例如在同一 Docker 网络里按服务名 `checkcc:80` 转发），需要改成 `checkcc:8080`。

更新前可以给当前镜像打一个回滚标签，出问题时不用重新构建就能退回：

```bash
docker tag checkcc:local checkcc:rollback-$(git rev-parse --short HEAD)
```

需要回滚时，先确认工作区没有未提交修改，再切换到目标提交并重新构建：

```bash
git status
git checkout <commit>
./deploy/deploy.sh
# 回滚完成后切回主分支，并重新构建
git checkout main
./deploy/deploy.sh
```

清理构建资源前先确认没有其他服务依赖这些镜像：

```bash
docker system df
docker image prune
docker builder prune
```

不要在没有确认的情况下使用 `docker system prune -a`，它可能影响同一台服务器上的其他项目。

## 8. 常见坑位与排查

下面的 `PORT` 从 `.env` 读取；没有设置时按默认 `8080` 处理。

先跑这三条，通常能定位大部分问题：

```bash
PORT="$(sed -n 's/^CHECKCC_PORT=//p' .env | tail -n 1)"
PORT="${PORT:-8080}"
docker compose ps
docker compose logs --tail=100 checkcc
curl -v "http://127.0.0.1:${PORT}/healthz"
```

| 现象 | 常见原因 | 处理 |
| --- | --- | --- |
| `docker: command not found`、`Cannot connect to the Docker daemon` 或权限不足 | Docker 未安装、未启动，或当前用户不在 `docker` 组 | 按官方文档安装；`sudo systemctl enable --now docker`；`sudo usermod -aG docker "$USER"` 后重新登录 |
| `port is already allocated` 或 `address already in use` | `CHECKCC_PORT` 被其他程序占用 | `ss -lntp \| grep ":${PORT}"` 查占用；换 `CHECKCC_PORT`；同步修改反向代理 |
| 构建时进程被杀、退出码 137 | 内存不足 | 按 2.2 加 swap，或换更大内存的机器；`dmesg \| tail` 查看 OOM 记录 |
| `no space left on device` | 磁盘或 Docker 数据目录满了 | `df -h`、`docker system df`；清理未使用镜像/构建缓存，或扩容磁盘 |
| `docker compose: command not found` | 只装了 Docker Engine，没有 Compose v2 插件 | 安装 `docker-compose-plugin`；用 `docker compose version` 验证 |
| 修改 `.env` 后页面没变化 | 改的是 `NEXT_PUBLIC_*`（构建时变量），或没有在仓库根目录执行 | 重新执行 `./deploy/deploy.sh`；用 `docker compose config` 检查实际构建参数；命令行变量会覆盖 `.env` |
| canonical、hreflang 或 sitemap 为空/仍是旧域名 | `NEXT_PUBLIC_SITE_URL` 为空，或修改后没有重新构建 | 填写正确的公网地址（建议 HTTPS），重新构建 |
| 反向代理返回 502 | 代理目标端口不对、CheckCC 容器不健康，或代理在另一个容器里访问了错误的 `127.0.0.1` | `docker compose ps`、`docker compose logs`；直接 curl 宿主机端口；容器代理要用同一 Docker 网络的服务名 |
| `/en` 或 `/hong-kong` 返回 404 | 访问地址缺少末尾 `/`，或静态托管没有启用目录重定向 | 用 `/en/`、`/hong-kong/` 访问；直接访问宿主机端口对比；静态托管需保留目录式路由 |
| 网络层一直失败 | 第三方接口被浏览器网络、CORS 或限流拦截，不是服务器故障 | 看浏览器控制台；`ipwho.is` 失败会依次尝试 `get.geojs.io` 和 `ipapi.co`；全部失败时页面会跳过 IP 信号，Nginx 日志不会有帮助 |
| 容器一直是 `unhealthy` | 容器启动失败、端口未监听或健康检查命令失败 | `docker compose logs --tail=100 checkcc`；`docker inspect checkcc`；确认容器内 8080 端口正常 |
| SSH 隧道连接失败 | 本地端口被占用、服务器端口写错，或 SSH 会话已断开 | 换一个本地端口；确认 `CHECKCC_PORT`；保持 SSH 会话，必要时用 `-v` 查看原因 |
| `./deploy/deploy.sh: Permission denied` | 文件没有执行权限（常见于下载 zip 后） | `chmod +x deploy/deploy.sh` 后重试 |

不要做的事：

- 不要把 8080 直接长期暴露公网；至少限制来源，正式环境使用 80/443 和 TLS。
- 不要在运行中的容器里改文件；改源码或 `.env` 后重新构建。
- 不要用 `next start` 启动本项目；它是静态导出，没有 Node 服务端。
- 不要把 `.env` 提交到 Git。
- 不要假设 8080 一定空闲，也不要把文档里的示例端口直接当成你的生产端口。

## 9. 参考验证记录

以下仅记录一次实际验证，不是最低配置，也不限制其他受 Docker 支持的发行版：

- Debian 13，2 GB 内存 + 2 GB swap；
- Docker Engine 29.9.2，Docker Compose v5.6.1；
- 构建、健康检查、`/`、`/en/`、`/hong-kong/`、`/russia/`、404 和容器重启通过；
- gzip、静态资源长期缓存、HTML no-cache 和基础安全头生效；
- 浏览器默认不发起 IP 查询；开启网络层后，`ipwho.is` 返回 429 时自动回退 `ipapi.co`，两个接口都失败时跳过网络信号且不抬高分数。

版本号只是这次验证的环境记录；请按 Docker 官方支持范围选择版本。本次验证未包含域名、TLS 和公网暴露配置。

2026-10-30 在同一环境上验证了加固后的镜像（`9a079d7`）：

- 按 digest 锁定的基础镜像拉取正常，构建通过；
- 容器以 uid 101 运行，根文件系统只读、去掉全部 capabilities 后健康检查为 `healthy`，日志无写入错误；
- 四语言路由、`/healthz`、`robots.txt`、`sitemap.xml` 返回 200，未知路径返回 404，RSC 预取文件（文件名含 `!`）返回 200；
- HTML 和 `/_next/static/` 都带 CSP 与其他安全头；`/en` 跳转为相对路径 `/en/`；
- 无头 Chrome 开启网络层完成检测，CSP 违规 0 次。

### 容器加固

- 基础镜像按 digest 锁定，见 `Dockerfile` 顶部注释里的刷新命令。
- 运行镜像是 `nginxinc/nginx-unprivileged`，以 uid 101 运行，容器内监听 8080。
- `docker-compose.yml` 设置了 `read_only: true`、只给 `/tmp` 挂 16 MB 的 tmpfs，并 `cap_drop: ALL`。
- 构建时由 `deploy/csp.mjs` 按 `NEXT_PUBLIC_*` 端点生成 `Content-Security-Policy`。`connect-src` 只允许本站、IP 查询接口、IPv6 查询接口和三个 Anthropic 探测地址。修改这些端点后需要重新构建。关闭网络层（`NEXT_PUBLIC_IP_INTEL_ENABLED=false`）时 `connect-src` 只剩 `'self'`。
- Next.js 静态导出会内联页面数据脚本，所以 `script-src` 保留 `'unsafe-inline'`。

## 10. 说明

- 本项目是纯静态站点，容器内没有 Node 服务端运行时，也没有数据库。
- IP 查询由访客浏览器直接请求第三方服务；服务器只托管静态文件。
- 页面中的站点 URL、canonical 和 sitemap 在构建时写入；换域名后需要重新构建。
- 容器以非 root 用户（uid 101）运行，根文件系统只读，未挂载宿主机目录，不需要额外文件权限。
- 如果不想使用 Docker，也可以把 `out/` 部署到任意静态托管，参见主 README 的“手动静态托管”。
