# Installation SmartNotify

## Prérequis

- Docker Desktop

## Installation

1. Cloner le projet

git clone ...

2. Lancer le projet

docker compose up -d

docker cp smartnotify_demo.dump smartnotify-postgres:/tmp/

docker exec -it smartnotify-postgres \
pg_restore \
-U postgres \
-d smartalerte_db \
--clean \
--if-exists \
/tmp/smartnotify_demo.dump

## Accès

Application :
http://localhost:3000

API :
http://localhost:8000

Mailpit :
http://localhost:8025