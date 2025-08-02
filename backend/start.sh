#!/bin/bash
# Disable uvloop to prevent memory corruption
uvicorn main:app --host=0.0.0.0 --port=10000 --loop asyncio