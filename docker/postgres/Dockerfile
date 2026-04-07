FROM pgvector/pgvector:pg16

RUN apt-get update \
    && apt-get install -y --no-install-recommends locales \
    && localedef -i es_ES -f UTF-8 es_ES.UTF-8 \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=es_ES.UTF-8
ENV LANGUAGE=es_ES:es
ENV LC_ALL=es_ES.UTF-8
