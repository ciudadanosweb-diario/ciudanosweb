import { useEffect, useState } from 'react';

interface WeatherData {
  temp: number;
  condition: string;
  humidity?: number;
  windSpeed?: number;
  isLoading: boolean;
  error?: string;
}

const LATITUDE = -27.7821; // Santiago del Estero
const LONGITUDE = -64.2637;

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData>({
    temp: 24,
    condition: 'Soleado',
    humidity: 60,
    windSpeed: 10,
    isLoading: true,
  });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setWeather(prev => ({ ...prev, isLoading: true }));
        
        // Usar Open-Meteo API (gratuita, sin API key requerida)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=celsius&timezone=auto`
        );

        if (!response.ok) {
          throw new Error('Error fetching weather');
        }

        const data = await response.json();
        const current = data.current;

        // Convertir código de clima a descripción en español
        const weatherCondition = getWeatherCondition(current.weather_code);

        setWeather({
          temp: Math.round(current.temperature_2m),
          condition: weatherCondition,
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching weather:', error);
        setWeather(prev => ({
          ...prev,
          isLoading: false,
          error: 'Error al cargar el clima',
          temp: 24,
          condition: 'No disponible'
        }));
      }
    };

    fetchWeather();

    // Actualizar cada 10 minutos (600000 ms)
    const interval = setInterval(fetchWeather, 600000);

    return () => clearInterval(interval);
  }, []);

  return weather;
}

// Mapeo de códigos WMO a descripciones en español
function getWeatherCondition(code: number): string {
  const weatherCodes: Record<number, string> = {
    0: 'Despejado',
    1: 'Mayormente Despejado',
    2: 'Parcialmente Nublado',
    3: 'Nublado',
    45: 'Niebla',
    48: 'Escarcha',
    51: 'Lluvia Ligera',
    53: 'Lluvia Moderada',
    55: 'Lluvia Intensa',
    61: 'Lluvia Ligera',
    63: 'Lluvia Moderada',
    65: 'Lluvia Fuerte',
    71: 'Nieve Ligera',
    73: 'Nieve Moderada',
    75: 'Nieve Fuerte',
    80: 'Aguaceros Ligeros',
    81: 'Aguaceros Moderados',
    82: 'Aguaceros Fuertes',
    85: 'Nieve con Aguaceros',
    86: 'Nieve con Aguaceros Fuertes',
    95: 'Tormenta',
    96: 'Tormenta con Granizo',
    99: 'Tormenta con Granizo Fuerte',
  };

  return weatherCodes[code] || 'Clima Variable';
}
