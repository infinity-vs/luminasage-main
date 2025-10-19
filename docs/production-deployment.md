# Production Deployment Guide

This guide provides instructions for building and deploying the Dyad application in a production environment.

## Building the Application

The Dyad application is built using [Electron Forge](https://www.electronforge.io/), a complete tool for creating, publishing, and installing modern Electron applications.

### Prerequisites

-   Node.js (version >= 20)
-   npm

### Build Steps

1.  **Install dependencies**:

    ```bash
    npm install
    ```

2.  **Create a distributable package**:

    The `make` script will create a distributable package for your current operating system. The output will be in the `out` directory.

    ```bash
    npm run make
    ```

3.  **Publish the application**:

    The `publish` script will build the application and publish it to the configured release provider (e.g., GitHub Releases).

    ```bash
    npm run publish
    ```

    **Note**: You will need to have a `publish` block in your `package.json` file to configure the release provider.

## Distributed Environment Setup

For the distributed features of the AI Collaboration Mode System to function, you will need to set up a MongoDB and Redis instance. We provide a Docker Compose file to simplify this process.

### Prerequisites

-   [Docker](https://www.docker.com/)
-   [Docker Compose](https://docs.docker.com/compose/)

### Running the Distributed Services

1.  **Start the services**:

    The following command will start the MongoDB and Redis containers in the background.

    ```bash
    docker-compose -f docker-compose.distributed.yml up -d
    ```

2.  **Verify the services are running**:

    You can check the status of the containers using the `ps` command.

    ```bash
    docker-compose -f docker-compose.distributed.yml ps
    ```

3.  **Stop the services**:

    To stop the services, use the `down` command.

    ```bash
    docker-compose -f docker-compose.distributed.yml down
    ```

### Management Tools

The Docker Compose file also includes optional management tools for MongoDB and Redis. To start the services with these tools, use the `--profile tools` flag.

```bash
docker-compose -f docker-compose.distributed.yml --profile tools up -d
```

Once the services are running, you can access the management tools at the following URLs:

-   **Mongo Express**: [http://localhost:8082](http://localhost:8082) (admin/admin)
-   **Redis Commander**: [http://localhost:8081](http://localhost:8081)

## Configuration

The Dyad application will automatically connect to the MongoDB and Redis instances at their default ports (`27017` and `6379`). If you are running these services on a different host or port, you will need to set the following environment variables:

-   `MONGODB_URL`: The connection URL for your MongoDB instance.
-   `REDIS_URL`: The connection URL for your Redis instance.
