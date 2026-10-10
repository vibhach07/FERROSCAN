import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "ANVESHAA" in response.json()["message"]

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["simulation_available"] is True

def test_config():
    response = client.get("/api/config")
    assert response.status_code == 200
    data = response.json()
    assert "COPERNICUS" in data["gee_default_dataset"]
    assert len(data["supported_layers"]) >= 3

def test_gee_status():
    response = client.get("/api/gee/status")
    assert response.status_code == 200
    data = response.json()
    assert "initialized" in data
    assert "message" in data

def test_gee_layers():
    payload = {
        "aoi_boundary": [
            {"lat": 18.6172, "lng": 81.2292},
            {"lat": 18.6178, "lng": 81.2335},
            {"lat": 18.6142, "lng": 81.2341},
            {"lat": 18.6145, "lng": 81.2285},
        ],
        "date_start": "2024-01-01",
        "date_end": "2024-12-31",
        "cloud_cover_max": 20.0,
    }
    response = client.post("/api/gee/layers", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert len(data["layers"]) > 0

def test_prospectivity_analysis():
    payload = {
        "flight_id": "FLT-TEST",
        "mission_name": "Test Flight",
        "samples": [
            {
                "latitude": 18.615,
                "longitude": 81.231,
                "magnetic_anomaly_nt": 550.0,
                "ferric_iron_proxy": 1.4,
            },
            {
                "latitude": 18.6155,
                "longitude": 81.2315,
                "magnetic_anomaly_nt": 120.0,
                "ferric_iron_proxy": 0.9,
            },
        ],
        "aoi_boundary": [
            {"lat": 18.615, "lng": 81.231},
            {"lat": 18.616, "lng": 81.232},
            {"lat": 18.614, "lng": 81.232},
        ],
        "weight_mag": 0.70,
        "weight_spectral": 0.30,
        "grid_resolution_m": 25.0,
        "search_radius_m": 150.0,
    }
    response = client.post("/api/process/prospectivity", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["flight_id"] == "FLT-TEST"
    assert len(data["cells"]) > 0
    assert len(data["hotspots"]) >= 1
    assert "max_composite_index" in data["stats"]
    assert "Prototype limitation" in data["disclaimer"]
