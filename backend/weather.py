# Fichier : weather.py
import openmeteo_requests
import requests_cache
import numpy as np
from retry_requests import retry

def getirradiance(lat, lon): 
    try:
        cache_session = requests_cache.CachedSession('.cache', expire_after=300)
        retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
        openmeteo = openmeteo_requests.Client(session=retry_session)

        url = "https://satellite-api.open-meteo.com/v1/archive"
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "global_tilted_irradiance_instant",
            "models": "satellite_radiation_seamless",
            "timezone": "Africa/Tunis",
            "temporal_resolution": "native",
        }
        
        responses = openmeteo.weather_api(url, params=params)
        response = responses[0]
        hourly = response.Hourly()
        radiation_values = hourly.Variables(0).ValuesAsNumpy()

        # Filtrer les NaN et prendre la dernière valeur
        valid_values = radiation_values[~np.isnan(radiation_values)]
        
        if len(valid_values) > 0:
            return float(valid_values[-1])
        return 0.0
            
    except Exception as e:
        print(f"Erreur : {e}")
        return None
    

    