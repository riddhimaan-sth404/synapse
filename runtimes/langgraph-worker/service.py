"""
Synapse LangGraph Worker Service (v1.0)
Orchestrates multi-agent state graphs, persists thread checkpoints,
handles human-in-the-loop (HITL) pauses, and streams execution events to Synapse Core.
"""

from typing import Dict, Any, List, Optional
import os
import sys
import json
import uuid
import time
import asyncio
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Header, BackgroundTasks
from fastapi.responses import StreamingResponse

app = FastAPI(title="Synapse LangGraph Worker", version="1.0.0")

SYNAPSE_WORKER_TOKEN = os.environ.get("SYNAPSE_WORKER_TOKEN", os.environ.get("MUTEXFLOW_WORKER_TOKEN", ""))
SYNAPSE_BACKEND_URL = os.environ.get("SYNAPSE_BACKEND_URL", "http://127.0.0.1:3001")

# In-memory execution state and durable checkpoint mock/sqlite
ACTIVE_RUNS: Dict[str, Dict[str, Any]] = {}
CHECKPOINTS: Dict[str, List[Dict[str, Any]]] = {}

class StartWorkflowRequest(BaseModel):
    session_id: Optional[str] = None
    workflow_name: str
    workspace_root: str
    initial_prompt: str
    parameters: Optional[Dict[str, Any]] = None

class ResumeWorkflowRequest(BaseModel):
    session_id: str
    checkpoint_id: str
    approval_decision: str # "approved" | "denied"
    user_input: Optional[str] = None

def verify_token(x_synapse_token: Optional[str] = Header(None), x_mutexflow_token: Optional[str] = Header(None)):
    token = x_synapse_token or x_mutexflow_token
    if SYNAPSE_WORKER_TOKEN and token != SYNAPSE_WORKER_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized worker request")
    return True

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "runtime": "langgraph",
        "active_runs": len(ACTIVE_RUNS),
        "total_checkpoints": sum(len(c) for c in CHECKPOINTS.values())
    }

@app.post("/api/v1/workflows/start")
async def start_workflow(req: StartWorkflowRequest):
    session_id = req.session_id or str(uuid.uuid4())
    checkpoint_id = f"chk-{int(time.time()*1000)}"
    
    run_state = {
        "session_id": session_id,
        "workflow_name": req.workflow_name,
        "workspace_root": req.workspace_root,
        "status": "running",
        "step": 0,
        "last_checkpoint": checkpoint_id,
        "context": {
            "prompt": req.initial_prompt,
            "params": req.parameters or {},
            "history": []
        },
        "created_at": time.time(),
        "updated_at": time.time()
    }
    
    ACTIVE_RUNS[session_id] = run_state
    CHECKPOINTS[session_id] = [{
        "checkpoint_id": checkpoint_id,
        "step": 0,
        "node": "input_router",
        "state": json.dumps(run_state["context"]),
        "timestamp": time.time()
    }]
    
    return {
        "session_id": session_id,
        "checkpoint_id": checkpoint_id,
        "status": "running",
        "active_node": "input_router"
    }

@app.post("/api/v1/workflows/resume")
async def resume_workflow(req: ResumeWorkflowRequest):
    if req.session_id not in ACTIVE_RUNS:
        raise HTTPException(status_code=404, detail="Workflow run not found")
        
    run = ACTIVE_RUNS[req.session_id]
    if run["status"] != "waiting_approval":
        raise HTTPException(status_code=400, detail=f"Cannot resume run with status {run['status']}")
        
    if req.approval_decision != "approved":
        run["status"] = "cancelled"
        run["updated_at"] = time.time()
        return {"session_id": req.session_id, "status": "cancelled", "reason": "Approval denied"}
        
    run["status"] = "running"
    run["step"] += 1
    new_checkpoint = f"chk-{int(time.time()*1000)}"
    run["last_checkpoint"] = new_checkpoint
    run["updated_at"] = time.time()
    
    CHECKPOINTS[req.session_id].append({
        "checkpoint_id": new_checkpoint,
        "step": run["step"],
        "node": "resumed_executor",
        "state": json.dumps(run["context"]),
        "timestamp": time.time()
    })
    
    return {
        "session_id": req.session_id,
        "checkpoint_id": new_checkpoint,
        "status": "running"
    }

@app.get("/api/v1/workflows/{session_id}/checkpoints")
def get_checkpoints(session_id: str):
    if session_id not in CHECKPOINTS:
        raise HTTPException(status_code=404, detail="Session checkpoints not found")
    return {"session_id": session_id, "checkpoints": CHECKPOINTS[session_id]}

@app.get("/api/v1/workflows/{session_id}/events")
async def stream_events(session_id: str):
    if session_id not in ACTIVE_RUNS:
        raise HTTPException(status_code=404, detail="Session not found")
        
    async def event_generator():
        seq = 0
        run = ACTIVE_RUNS[session_id]
        yield f"event: node_started\ndata: {json.dumps({'sequence': seq, 'node': 'analyst_node', 'status': run['status']})}\n\n"
        seq += 1
        await asyncio.sleep(0.1)
        yield f"event: text_delta\ndata: {json.dumps({'sequence': seq, 'text': 'Evaluating workspace context...'})}\n\n"
        seq += 1
        yield f"event: completed\ndata: {json.dumps({'sequence': seq, 'status': 'success'})}\n\n"
        
    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("LANGGRAPH_WORKER_PORT", "8095"))
    uvicorn.run(app, host="127.0.0.1", port=port)
