# CheckCC VPS 部署（Docker + Nginx）

面向 Ubuntu / Debian，使用 Docker Compose 构建静态站点，并由 Nginx 容器提供服务。脚本只负责构建、启动和健康检查；域名、HTTPS 和反向代理由服务器所有者自行配置。

## 前置条件

- Ubuntu 22.04 / 24.04 或 Debian 12
- Docker Engine 20.10+（建议 24+），Docker Compose v2
- 一个可用的域名（可选，但建议配置）

安装 Docker：按官方文档操作，不要在生产服务器上直接执行来源不明的安装脚本。

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

## 一键部署

```bash
git clone https://github.com/Brilliant666/check-cc.git
cd check-cc
cp .env.example .env
# 编辑 .env，至少填写 NEXT_PUBLIC_SITE_URL
./deploy/deploy.sh
```

脚本会：

1. 检查 Docker 与 Compose 是否可用；
2. 首次运行时从 `.env.example` 创建 `.env`；
3. 执行 `docker compose up -d --build`；
4. 等待容器健康检查通过；
5. 输出访问地址、日志和重启命令。

默认监听 `0.0.0.0:8080`。如果前面还有 Nginx / Caddy / Traefik，建议改成只监听本机：

```bash
CHECKCC_BIND=127.0.0.1 CHECKCC_PORT=8080 ./deploy/deploy.sh
```

命令行传入的变量优先于 `.env`。脚本会从 Compose 的实际端口映射读取最终监听地址，避免配置与实际不一致。

## 配置项

`NEXT_PUBLIC_*` 在构建时读取，修改后需要重新执行 `./deploy/deploy.sh`；`CHECKCC_BIND` 和 `CHECKCC_PORT` 在启动时读取，重新执行脚本或 `docker compose up -d` 即可生效。

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 空 | 站点公开地址，例如 `https://check.example.com`。设置后才生成 canonical、hreflang、OG URL 和 sitemap |
| `NEXT_PUBLIC_REPO_URL` | 本仓库 | 页头、页脚使用的 GitHub 地址 |
| `NEXT_PUBLIC_IP_INTEL_ENABLED` | `true` | `false` 时彻底关闭网络层 |
| `NEXT_PUBLIC_IP_INTEL_ENDPOINT` | `https://ipwho.is/` | 浏览器直连的 CORS IP 查询接口 |
| `CHECKCC_BIND` | `0.0.0.0` | 宿主机监听地址 |
| `CHECKCC_PORT` | `8080` | 宿主机端口 |

## 反向代理示例

Nginx（宿主机）：

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

用 Caddy 更简单，自动签发 HTTPS：

```caddyfile
check.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

## 常用命令

```bash
docker compose logs -f checkcc    # 查看日志
docker compose up -d --build      # 重新构建并启动
docker compose restart checkcc    # 重启
docker compose down               # 停止并删除容器
```

## 更新版本

```bash
git pull
./deploy/deploy.sh
```

## 验证

```bash
curl -I http://127.0.0.1:8080/
curl http://127.0.0.1:8080/healthz
curl -I http://127.0.0.1:8080/hong-kong/
```

如果使用域名和 HTTPS，再把地址换成 `https://check.example.com`。

## 说明

- 本项目是纯静态站点，容器内没有 Node 服务端运行时，也没有数据库。
- IP 查询由访客浏览器直接请求第三方服务；服务器只托管静态文件。
- 页面中的站点 URL、canonical 和 sitemap 在构建时写入；换域名后需要重新构建。
- 容器以 Nginx 默认用户运行，未挂载宿主机目录，不需要额外文件权限。
