# Prawn STT Service

A local, Dockerized Speech-to-Text microservice for the Prawn video editor, powered by `sherpa-onnx` and the `Zipformer-30M` Vietnamese model.

## Prerequisites
- Docker installed and running.

## Quick Start

### 1. Build the Image
```bash
docker build -t prawn-stt .
```
*Note: The first build will take a few minutes as it downloads the ~100MB model files from Hugging Face.*

### 2. Run the Container
```bash
docker run -d -p 8000:8000 --name prawn-stt prawn-stt
```

### 3. Verify
Check if the service is running:
```bash
curl http://localhost:8000/health
# Output: {"status":"ok","model":"zipformer-vi-30M"}
```

## Integration with Prawn
1. Open Prawn Editor.
2. Go to **Settings** -> **Integrations**.
3. In the **AI** tab, scroll to **Custom STT Service URL**.
4. Enter `http://localhost:8000`.
5. Save changes.

Now, when you use "Auto Transcribe", Prawn will send audio to this local container instead of using the browser-based fallback.

## Deploy to Cloud (Modal.com)
This service is lightweight enough to run on Modal's free tier.

### 1. Setup
Install Modal client:
```bash
pip install modal
modal setup
```

### 2. Deploy
Run from this directory:
```bash
modal deploy modal_app.py
```

### 3. Use
Copy the URL returned by the deploy command (ending in `.modal.run`) and paste it into the **Custom STT Service URL** field in Prawn's settings.
