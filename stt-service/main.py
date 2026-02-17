import os
import time
import logging
import shutil
import tempfile
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import sherpa_onnx
import soundfile as sf
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stt-service")

app = FastAPI(title="Prawn STT Service", description="Local Vietnamese Speech-to-Text using Sherpa-ONNX")

# Global recognizer instance
recognizer = None

def get_recognizer():
    global recognizer
    if recognizer is not None:
        return recognizer

    logger.info("Initializing Sherpa-ONNX recognizer...")
    
    model_dir = "models"
    encoder = os.path.join(model_dir, "encoder-epoch-20-avg-10.int8.onnx")
    decoder = os.path.join(model_dir, "decoder-epoch-20-avg-10.onnx")
    joiner = os.path.join(model_dir, "joiner-epoch-20-avg-10.int8.onnx")
    tokens = os.path.join(model_dir, "config.json")

    if not all(os.path.exists(f) for f in [encoder, decoder, joiner, tokens]):
        logger.error(f"Model files not found! Checked for {encoder}, {decoder}, {joiner}, {tokens}")
        raise RuntimeError("Model files missing")

    logger.info(f"Loading model with: encoder={encoder}, decoder={decoder}, joiner={joiner}, tokens={tokens}")
    
    recognizer_config = sherpa_onnx.OfflineRecognizerConfig(
        tokens=tokens,
        encoder=encoder,
        decoder=decoder,
        joiner=joiner,
        num_threads=2,
        sample_rate=16000,
        feature_config=sherpa_onnx.FeatureConfig(
            sample_rate=16000,
            feature_dim=80,
        ),
        decoding_method="greedy_search",
        max_active_paths=4,
    )
    
    recognizer = sherpa_onnx.OfflineRecognizer(recognizer_config)
    
    logger.info("Recognizer initialized successfully.")
    return recognizer

@app.on_event("startup")
async def startup_event():
    get_recognizer()

@app.get("/health")
def health_check():
    return {"status": "ok", "model": "zipformer-vi-30M"}

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), language: str = Form("vi")):
    start_time = time.time()
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio.filename)[1]) as tmp:
        shutil.copyfileobj(audio.file, tmp)
        tmp_path = tmp.name

    try:
        # Load audio
        audio, sample_rate = sf.read(tmp_path, dtype="float32", always_2d=True)
        audio = audio[:, 0]  # Mono
        
        # Resample if necessary (Sherpa expects 16kHz)
        if sample_rate != 16000:
            # We would need to resample here. For MVP, assuming 16k or we fail/warn.
            # Real implementation should use librosa.resample or similar.
            # For this MVP, let's keep it simple and just log a warning.
            logger.warning(f"Input sample rate is {sample_rate}, expected 16000. Results may be poor.")

        rec = get_recognizer()
        stream = rec.create_stream()
        stream.accept_waveform(16000, audio)
        rec.decode_stream(stream)
        
        result = stream.result
        text = result.text
        
        # Format segments (timestamps are available in result.timestamps if enabled, 
        # but for simple offline API, text is primary. 
        # result.tokens and result.timestamps can be processed to get segments)
        
        # Basic segment construction from timestamped tokens if available, 
        # or just returning the whole text for now.
        # Sherpa OfflineRecognizer result has .text, .tokens, .timestamps
        
        timestamps = result.timestamps
        tokens = result.tokens
        
        # refined_segments logic could go here to group tokens into words/sentences
        # For now, return the full text.

        processing_time = time.time() - start_time
        
        return JSONResponse({
            "text": text,
            "segments": [], # TODO: Implement detailed segmentation mapping
            "processing_time": processing_time
        })

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        os.remove(tmp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
