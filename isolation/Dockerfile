# The container an isolated run's agent works in. It sees only its run folder
# (at /work) and a private home: Node, Chromium and Playwright, git for the
# screenshot history, the screenshot tool itself, and the harness CLIs.
# src/isolation.ts builds it, adding the screenshot tool's files to the context.
FROM node:24-bookworm

ARG CLAUDE_CODE_VERSION=2.1.286
ARG OPENCODE_VERSION=1.18.33
ARG CODEX_VERSION=0.159.3
ARG PLAYWRIGHT_VERSION=1.63.0

# Browsers in a shared location, so the unprivileged user below can launch them.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION} opencode-ai@${OPENCODE_VERSION} @openai/codex@${CODEX_VERSION} playwright@${PLAYWRIGHT_VERSION} \
 && playwright install --with-deps chromium \
 && rm -rf /root/.npm
# Playwright reachable from the filesystem root: Node looks for packages in every parent
# folder, so any script the agent writes in the run folder can import it, as can ./shot.
# (npm can't install into / itself, so it lives in its own folder, linked from there.)
RUN mkdir /opt/playwright && cd /opt/playwright && npm init -y > /dev/null \
 && npm install --no-audit --no-fund playwright@${PLAYWRIGHT_VERSION} && ln -s /opt/playwright/node_modules /node_modules \
 && rm -rf /root/.npm

COPY shot/ /opt/bench/
# A new volume takes the ownership of its path in the image, so the run's dependency
# volume (mounted at /work/app/node_modules) is writable by the user below.
RUN mkdir -p /work/app/node_modules && chown -R node:node /work

# The node image's own unprivileged user. Claude Code refuses to skip permission prompts as root.
USER node
ENV HOME=/home/node
# Where harness logins get mounted; created here so the harness can write next to them.
RUN mkdir -p /home/node/.local/share/opencode /home/node/.codex /home/node/.claude
WORKDIR /work
