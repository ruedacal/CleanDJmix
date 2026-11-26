import asyncio
import json
import os
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

router = APIRouter(tags=["copilot"])

_copilot_service = None
_ws_manager = None


def _get_service():
    global _copilot_service
    if _copilot_service is None:
        try:
            from services.copilot import copilot_service as svc
        except Exception:
            from services.copilot_service import copilot_service as svc
        _copilot_service = svc
    return _copilot_service


class CopilotSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._loop_task: Optional[asyncio.Task] = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        if self._loop_task is None or self._loop_task.done():
            self._loop_task = asyncio.create_task(self._push_loop())

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def _push_loop(self):
        svc = _get_service()
        while self.active_connections:
            try:
                state = svc.get_live_state()
                payload = json.dumps({"type": "copilot_state", "ts": time.time(), "data": state})
                stale = []
                for ws in list(self.active_connections):
                    try:
                        await ws.send_text(payload)
                    except Exception:
                        stale.append(ws)
                for ws in stale:
                    self.disconnect(ws)
            except Exception:
                pass
            await asyncio.sleep(1.0 / 30.0)


def _get_ws_manager() -> CopilotSocketManager:
    global _ws_manager
    if _ws_manager is None:
        _ws_manager = CopilotSocketManager()
    return _ws_manager


@router.websocket("/ws/copilot")
async def ws_copilot_router(websocket: WebSocket):
    mgr = _get_ws_manager()
    svc = _get_service()
    await mgr.connect(websocket)
    try:
        init_state = svc.get_live_state()
        await websocket.send_text(json.dumps({"type": "copilot_state", "ts": time.time(), "data": init_state}))
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw) if raw else {}
                if isinstance(msg, dict) and msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong", "client_ts": msg.get("client_ts"), "server_ts": time.time()})
            except Exception:
                pass
    except WebSocketDisconnect:
        mgr.disconnect(websocket)


@router.get("/api/copilot/waveform/{deck_id}")
def api_copilot_waveform_router(deck_id: int):
    return _get_service().get_deck_waveform_3band(deck_id)


@router.get("/api/copilot/status")
def api_copilot_status_router():
    return _get_service().get_live_state()


@router.get("/api/copilot/stream")
async def api_copilot_stream_router():
    svc = _get_service()

    async def event_generator():
        while True:
            state = svc.get_live_state()
            yield f"data: {json.dumps(state)}\n\n"
            await asyncio.sleep(1.0 / 30.0)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/api/copilot/platforms")
def api_copilot_platforms_router():
    svc = _get_service()
    return {
        "platform_mode": svc.platform_mode,
        "active_platform": svc.detect_active_platform(),
        "platforms": svc.get_available_platforms(),
    }


@router.post("/api/copilot/set_platform")
def api_copilot_set_platform_router(payload: Dict[str, Any] = Body(default={})):
    return _get_service().set_platform(payload.get("platform", "auto"))


@router.post("/api/copilot/set_master")
def api_copilot_set_master_router(payload: Dict[str, Any] = Body(default={})):
    return _get_service().set_manual_master(payload.get("master", "toggle"))


@router.post("/api/copilot/toggle_play")
def api_copilot_toggle_play_router(payload: Dict[str, Any] = Body(default={})):
    return _get_service().toggle_play(payload.get("deck", "master"))


@router.post("/api/copilot/cue_deck")
def api_copilot_cue_deck_router(payload: Dict[str, Any] = Body(default={})):
    return _get_service().cue_deck(payload.get("deck", "1"))


@router.post("/api/copilot/toggle_simulation")
def api_copilot_toggle_simulation_router():
    svc = _get_service()
    svc.simulation_mode = not svc.simulation_mode
    return svc.get_live_state()


@router.post("/api/copilot/set_anti_muddy_mode")
def api_copilot_set_anti_muddy_router(payload: Dict[str, Any] = Body(default={})):
    return _get_service().set_anti_muddy_mode(payload.get("mode", "auto"))


@router.get("/api/copilot/info")
def api_copilot_info_router():
    svc = _get_service()
    db_path = getattr(svc, "serato_db_path", "")
    return {
        "ip": svc.get_local_ip(),
        "active_platform": svc.detect_active_platform(),
        "platform_mode": svc.platform_mode,
        "platforms": svc.get_available_platforms(),
        "serato_detected": bool(db_path and os.path.exists(db_path)),
        "serato_db_path": db_path,
        "simulation_mode": getattr(svc, "simulation_mode", False),
    }
