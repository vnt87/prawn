# Use bun image
FROM oven/bun:1.1-slim AS base
WORKDIR /app

# Install dependencies
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Build the application
FROM base AS build
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# Final runner image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=1338
ENV HOSTNAME="0.0.0.0"

# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# Expose the port
EXPOSE 1338

# Start the application
CMD ["bun", "server.js"]
