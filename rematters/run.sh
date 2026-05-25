#!/usr/bin/with-contenv bashio
# shellcheck shell=bash

bashio::log.info "Starting Rematters..."

export REMATTERS_DATA="/data"
export REMATTERS_OPTIONS="/data/options.json"
export REMATTERS_PORT="8099"

exec python3 /app/main.py
