import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.incidents import router as incidents_router, _incident_service, _hindsight_service
from backend.api.memory import router as memory_router
from backend.api.patterns import router as patterns_router
from backend.api.demo import router as demo_router
from backend.api.copilot import router as copilot_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("failback")

app = FastAPI(
    title="FAILBACK - Failure-Aware Incident Learning Agent",
    description="Incident Response & Learning Agent powered by Hindsight persistent memory.",
    version="1.0.0",
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(incidents_router)
app.include_router(memory_router)
app.include_router(patterns_router)
app.include_router(demo_router)
app.include_router(copilot_router)

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing FAILBACK backend and Hindsight memory bank...")
    stats = _hindsight_service.get_stats()
    logger.info(f"Hindsight Bank '{stats['bank_id']}' loaded with {stats['total_memories']} memories.")
    if stats["total_memories"] == 0:
        logger.info("Initial memory bank empty. Seeding historical incidents from synthetic dataset...")
        count = _incident_service.seed_hindsight_from_synthetic(_hindsight_service)
        logger.info(f"Seeded {count} incidents into Hindsight memory bank.")

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "FAILBACK Incident Learning Agent",
        "tagline": "Your team's failed fixes shouldn't have to fail twice.",
        "hindsight": _hindsight_service.get_stats(),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
