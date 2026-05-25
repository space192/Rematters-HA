ARG BUILD_FROM
FROM ${BUILD_FROM}

RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-virtualenv

WORKDIR /app

COPY app/requirements.txt .
RUN python3 -m venv /venv \
    && /venv/bin/pip install --no-cache-dir -r requirements.txt

COPY app/ /app/
COPY run.sh /
RUN chmod a+x /run.sh

ENV PATH="/venv/bin:$PATH"

CMD [ "/run.sh" ]
