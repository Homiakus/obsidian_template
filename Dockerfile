FROM ubuntu:24.04
RUN apt-get update && apt-get install -y \
    blender assimp-utils nodejs npm python3 python3-pip git curl \
    && rm -rf /var/lib/apt/lists/*
RUN npm install -g gltf-validator gltfpack
# COPY FBX2glTF /usr/local/bin/FBX2glTF  # (опционально: положите бинарник)
ENV PATH="/usr/local/bin:${PATH}"
WORKDIR /work
