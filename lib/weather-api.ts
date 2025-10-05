export interface WeatherData {
  temperature: number
  precipitation: number
}

export async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  try {
    // Try NASA POWER API first
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      return `${year}${month}${day}`
    }

    const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,T2M_MIN&community=AG&longitude=${lon}&latitude=${lat}&start=${formatDate(yesterday)}&end=${formatDate(today)}&format=JSON`

    const nasaResponse = await fetch(nasaUrl)
    const nasaData = await nasaResponse.json()

    if (nasaData.properties?.parameter?.T2M_MAX) {
      const temps = Object.values(nasaData.properties.parameter.T2M_MAX) as number[]
      const validTemps = temps.filter((t) => t !== -999)

      if (validTemps.length > 0) {
        const avgTemp = validTemps.reduce((a, b) => a + b, 0) / validTemps.length
        return {
          temperature: Math.round(avgTemp * 10) / 10,
          precipitation: 0,
        }
      }
    }
  } catch (error) {
    console.error("NASA API error:", error)
  }

  try {
    // Fallback to Open-Meteo
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`

    const meteoResponse = await fetch(meteoUrl)
    const meteoData = await meteoResponse.json()

    if (meteoData.daily) {
      const maxTemp = meteoData.daily.temperature_2m_max[0]
      const minTemp = meteoData.daily.temperature_2m_min[0]
      const avgTemp = (maxTemp + minTemp) / 2

      return {
        temperature: Math.round(avgTemp * 10) / 10,
        precipitation: meteoData.daily.precipitation_sum[0] || 0,
      }
    }
  } catch (error) {
    console.error("Open-Meteo API error:", error)
  }

  // Default fallback
  return {
    temperature: 25,
    precipitation: 0,
  }
}
