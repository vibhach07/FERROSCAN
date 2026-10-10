# Google Earth Engine (GEE) Configuration Guide

This guide walks through configuring real Google Earth Engine surface reflectance and elevation layers in ANVESHAA.

> [!NOTE]
> ANVESHAA is fully usable out of the box without Google Earth Engine credentials. When credentials are not configured, the dashboard functions in local simulation mode with synthetic magnetometer readings and Esri/OpenStreetMap basemaps.

---

## 1. Prerequisites

1. A Google Cloud account with access to Google Earth Engine.
2. An active Google Cloud Project with the **Earth Engine API** enabled.
3. Registered Earth Engine access ([Noncommercial eligibility](https://earthengine.google.com/noncommercial/) or Commercial license).

---

## 2. Authentication Methods

### Method A: Application Default Credentials (ADC) — Recommended for Local Dev

If you are developing locally on macOS, Linux, or Windows:

1. Install the Google Cloud SDK (`gcloud`) or the Earth Engine CLI:
   ```bash
   pip install earthengine-api
   ```

2. Authenticate with your Google account:
   ```bash
   earthengine authenticate
   ```

3. Configure your project in `backend/.env`:
   ```dotenv
   GEE_ENABLED=true
   GEE_PROJECT_ID=your-google-cloud-project-id
   GEE_AUTH_MODE=adc
   ```

---

### Method B: Service Account — Recommended for Production / Deployments

1. In the Google Cloud Console, navigate to **IAM & Admin > Service Accounts**.
2. Create a service account (e.g. `anveshaa-gee@your-project.iam.gserviceaccount.com`).
3. Assign the **Earth Engine Resource Viewer** role (or register the service account email in the Earth Engine registered users list).
4. Create a JSON key for the service account and download it.
5. Place the key file in a secure directory (never commit it to Git).
6. Configure `backend/.env`:
   ```dotenv
   GEE_ENABLED=true
   GEE_PROJECT_ID=your-google-cloud-project-id
   GEE_AUTH_MODE=service_account
   GEE_SERVICE_ACCOUNT_EMAIL=anveshaa-gee@your-project.iam.gserviceaccount.com
   GEE_SERVICE_ACCOUNT_KEY_FILE=/path/to/your/service-account-key.json
   ```

---

## 3. Testing GEE Connectivity

Once configured, restart the backend server:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Verify status by opening:
[http://127.0.0.1:8000/api/gee/status](http://127.0.0.1:8000/api/gee/status)

Expected successful response:
```json
{
  "initialized": true,
  "project_id": "your-google-cloud-project-id",
  "auth_mode": "adc",
  "message": "Google Earth Engine is live and connected.",
  "catalog_available": true
}
```

The frontend dashboard top bar will display a green `GEE LIVE` badge, and real Sentinel-2 Level-2A surface reflectance tiles will stream onto the Leaflet map.

---

## 4. Troubleshooting

- **`ee.EEException: Not signed up for Earth Engine`**: Ensure your Google account or service account has completed the Earth Engine registration form at [earthengine.google.com](https://earthengine.google.com/).
- **`PermissionDenied: Earth Engine API has not been used in project`**: Enable the Earth Engine API in Google Cloud Console under **APIs & Services > Library**.
- **`Cloud project not found`**: Double check `GEE_PROJECT_ID` in `.env`.
